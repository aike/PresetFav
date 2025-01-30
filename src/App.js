import React, { useEffect, useState } from 'react';
import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import "@szhsin/react-menu/dist/theme-dark.css";
import { auth, signInWithX, logout, setRating, subscribeUserRatings } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './App.css';

let presetLoaded = false;

function App() {
  const sortFnA = (a, b, key) => a[key].localeCompare(b[key]);
  const sortFnD = (a, b, key) => b[key].localeCompare(a[key]);
  const getFav = (id) => userRatings[id] ? userRatings[id].rating : 0;
  const sortFnFavA = (a, b, key) => getFav(a[key]) - getFav(b[key]);
  const sortFnFavD = (a, b, key) => getFav(b[key]) - getFav(a[key]);

  const [user, setUser] = useState(null);
  const [userRatings, setUserRatings] = useState({});
  const inputRef = React.useRef();
  const [keyword, setKeyword] = useState("");
  const [showList, setShowList] = useState(false);

  const [presetTitle, setPresetTitle] = useState("");
  const [presetNames, setPresetNames] = useState("");
  const [presetId, setPresetId] = useState("");
  const [preset, setPreset] = useState({"" : []});

  const [selectedList, setSelectedList] = useState("");
  const [filteredList, setFilteredList] = useState([]);
  const [sort, setSort] = useState({ key: 'id', dir: 'asc' });

  // ソート関数
  const sortList = (key, dir, list) => {
    setSort({ key: key, dir: dir });
    if (list === undefined) return [];
    if (list.length === 0) return [];
    if (key === 'fav') {
      let sortFn = (dir === 'asc') ? sortFnFavA : sortFnFavD;
      return list.sort((a, b) => sortFn(a, b, 'id'));  
    } else {
      let sortFn = (dir === 'asc') ? sortFnA : sortFnD;
      return list.sort((a, b) => sortFn(a, b, key));  
    }
  }

  const onSort = (key) => {
    const dir = (key === sort.key) ? (sort.dir === 'asc' ? 'dsc' : 'asc') : 'asc';
    let sortedList = sortList(key, dir, filteredList);
    setFilteredList(sortedList);
  };

  // ソート＆絞り込み関数
  const filterList = (list, keyword) => {
    const s = keyword.trim().toLowerCase();

    if (s.length === 0) {
      //トリム後の検索文字列が0文字の場合、フィルターなし
      return sortList(sort.key, sort.dir, list);
    } else if (s.length === 1) {
      //トリム後の検索文字列が1文字の場合、絞り込みに時間がかかるのを回避するため０件表示
      return [];
    }

    return sortList(sort.key, sort.dir, list.filter((item) =>
      (item.name.toLowerCase().indexOf(s) !== -1)
      || (item.cat.toLowerCase().indexOf(s) !== -1)
    ));
  };

  useEffect(() => {
    // プリセットデータを読み込む
    if (!presetLoaded) {
      presetLoaded = true;
      const script = document.createElement('script');
      script.src = './presets.js';
      script.id = 'presetdata';
      //script.async = true;
      script.onload = () => {
        setPresetTitle(window.ptitle);
        setPresetNames(window.pnames);
        setPresetId(window.pid);
        setPreset(window.pdata);
        setSelectedList(window.pnames[0]);
        setFilteredList(window.pdata[window.pnames[0]]);
        setShowList(true);
        console.log('set preset data');
      };
      if (!document.getElementById('presetdata')) {
        document.body.appendChild(script);
      }
    }

    // Auth状態を監視
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {

        // ログインしたらレーティングを購読開始
        console.log("get db data");
        const unsubRatings = subscribeUserRatings(currentUser.uid, (ratingsMap) => {
          setUserRatings(ratingsMap);
        });
        // Cleanup
        return () => unsubRatings();
      } else {
        // ログアウトしたらクリア
        setUserRatings({});
      }
    });

    if (inputRef.current) {
      const node = inputRef.current;
      node.focus();
      setShowList(true);
    }
    setFilteredList(filterList(preset[selectedList], keyword));

    return () => unsubAuth();

  }, [keyword]);


  const createTsvData = (listname) => {
    let s = "";
    const matchedPresets = preset[listname].filter((item) => userRatings[item.id] !== undefined);
    matchedPresets.forEach((item) => {
      const fav = userRatings[item.id].rating;
      s += `${listname}\t${item.num}\t${item.cat}\t${item.name}\t${fav}\n`;
    });
    return s;
  };


  const exportData = () => {

    let tsv = 'list\tnumber\tcategory\tname\tfavorite\n';
    for (let listname of presetNames) {
      tsv += createTsvData(listname);
    }
    const data = JSON.stringify(userRatings);
    const blob = new Blob([tsv], { type: 'text/tsv' });
    const url = URL.createObjectURL(blob);

    const container = document.getElementById('dlcontainer');
    let link = container.querySelector('a');
    if (!link) {
      link = document.createElement('a');
      container.appendChild(link);
    }
    link.href = url;
    link.download = 'export.tsv';
    link.style.display = 'none';
    link.click();
    URL.revokeObjectURL(url);
  };

  const onSelButton = (list) => {
    setSelectedList(list); 
    setFilteredList(filterList(preset[list], keyword));
  };

  const SelButton = (props) => {
    return (
      <div
      className={ selectedList === props.name ? 'list-sel-button' : 'list-unsel-button' }
      onClick={() => onSelButton(props.name)}>
        {props.name}
    </div>
  )};

  const onRatingChange = async (key, newRating) => {
    if (!user) return;
    // Firebaseに保存
    await setRating(presetId, user.uid, key, newRating);
  };

  const ListItems = (props) => {
    return (
      <tr><td className="number">{props.num}</td><td className="cat">{props.cat}</td><td className="name">{props.name}</td>
      <td className="fav">
      {
        <span
          className="star-del"
          style={{ cursor: user ? 'pointer' : 'default' }}
          onClick={() => user && onRatingChange(props.id, 0)}
        >
        ×
        </span>
      }
      {
        [1,2,3,4,5].map(star => (
        <span
          key={star}
          className="star"
          style={{ 
            cursor: user ? 'pointer' : 'default',
            color: user ? (star <= getFav(props.id) ? '#f0f0a0' : '#606060') : '#0000'
          }}
          onClick={() => user && onRatingChange(props.id, star)}
        >
          ★
        </span>
      ))}
      </td>
    </tr>
  )};

  return (
    <div className='App'>
      <div className="datatable-container">

        <div className="header-tools">
          <div className="search">
            <input type="search" className="search-input" placeholder="Search..."
              ref={inputRef}
              onChange={(e) => setKeyword(e.target.value)}
              onClick={() => setShowList(true)}
            />
          </div>
          <div id="app_title">Preset Fav 
            <span id="subtitle">sound list tool</span>
            <span id="insttitle">[{presetTitle}]</span> 
          </div>
          <div id="home"> 
            <a href="https://aike.github.io/PresetFav">home</a>
          </div>
          <div id="about"> 
            <a href="https://github.com/aike/PresetFav">about</a>
          </div>
          {user ? (
            <div id="userarea">
              <Menu theming="dark" menuButton={<img className="usericon" src={user.photoURL} alt="user" title={user.displayName} />} transition>
                <MenuItem onClick={exportData}>Export</MenuItem>
                <MenuItem onClick={logout}>Log Out</MenuItem>
              </Menu>  
              </div>
          ) : (
            <div id="userarea">
              <span className="login" onClick={signInWithX}>Login</span>
            </div>          
          )}
          <div id="dlcontainer"></div>
        </div>

        { presetNames.length > 1 ? (
          <div id="select-list-area">
            { presetNames.map((presetname) => <SelButton name={presetname} />) }
          </div>
        ) : null }

        <table className="datatable">
          <thead>
            <tr>
              <th id="tab_id" onClick={()=>onSort('id')}>NUMBER<span className="tab_sortmark">{sort.key==='id' ? sort.dir==='asc' ? '▲' : '▼' : '　'}</span></th>
              <th id="tab_cat" onClick={()=>onSort('cat')}>CATEGORY<span className="tab_sortmark">{sort.key==='cat' ? sort.dir==='asc' ? '▲' : '▼' : '　'}</span></th>
              <th id="tab_name" onClick={()=>onSort('name')}>NAME<span className="tab_sortmark">{sort.key==='name' ? sort.dir==='asc' ? '▲' : '▼' : '　'}</span></th>
            {user ? (<th id="tab_fav" onClick={()=>onSort('fav')}>FAVORITE<span className="tab_sortmark">{sort.key==='fav' ? sort.dir==='asc' ? '▲' : '▼' : '　'}</span></th>) : (<th id="tab_fav" style={{color:"gray"}}>FAVORITE (need login)</th>)}
            </tr>
          </thead>
          <tbody>
            {showList &&
            filteredList.map((item) => <ListItems key={item.id} id={item.id} num={item.num} name={item.name} cat={item.cat} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
