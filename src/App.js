import React, { useEffect, useState } from 'react';
import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import "@szhsin/react-menu/dist/theme-dark.css";
import { auth, signInWithX, logout, setRating, subscribeUserRatings } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { presetTitle, preset, presetNames } from './presets';
import './App.css';

function App() {
  const sortFnA = (a, b, key) => a[key].localeCompare(b[key]);
  const sortFnD = (a, b, key) => b[key].localeCompare(a[key]);
  const getFav = (id) => userRatings[id] ? userRatings[id].rating : 0;
  const sortFnFavA = (a, b, key) => getFav(a[key]) - getFav(b[key]);
  const sortFnFavD = (a, b, key) => getFav(b[key]) - getFav(a[key]);

//  const [PRESETS, setPresets] = useState(PRESETS3);
  const [user, setUser] = useState(null);
  const [userRatings, setUserRatings] = useState({});
  const inputRef = React.useRef();
  const [keyword, setKeyword] = useState("");
  const [showList, setShowList] = useState(false);
  const [filteredList, setFilteredList] = useState(preset['Tone']);
  const [selectedList, setSelectedList] = useState('Tone');
  const [sort, setSort] = useState({ key: 'id', dir: 'asc' });

  const sortList = (key, dir, list) => {
    setSort({ key: key, dir: dir });
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

  useEffect(() => {
    // Auth状態を監視
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {

        // ログインしたらレーティングを購読開始
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

    const ret = () => unsubAuth();

    if (inputRef.current) {
      const node = inputRef.current;
      node.focus();
      setShowList(true);
    }

    // 以降は絞り込み処理
    let sortFn = sort.dir === 'asc' ? sortFnA : sortFnD;

    // 検索フォームが空欄の場合、絞り込みを解除
    if (keyword === "") {
      setFilteredList(sortList(sort.key, sort.dir, preset[selectedList]));
      return ret;
    }

    // 検索文字列をトリム、小文字変換
    const searchKeyword = keyword
      .trim()
      .toLowerCase();

    //トリム後の検索文字列が1文字の場合、絞り込みに時間がかかるのを回避するため０件表示
    if (searchKeyword.length === 1) {
      setFilteredList([]);
      return ret;
    }
    
    //トリム後の検索文字列が0文字の場合
    if (searchKeyword === null) {
      setFilteredList(sortList(sort.key, sort.dir, preset[selectedList]));
      return ret;
    }

    // 絞り込みとソート
    const result = sortList(sort.key, sort.dir, preset[selectedList].filter((preset) =>
         (preset.name.toLowerCase().indexOf(searchKeyword) !== -1)
      || (preset.category.toLowerCase().indexOf(searchKeyword) !== -1)));
    setFilteredList(result.length ? result : [["No Item Found"]]);

    return ret;
  }, [keyword]);

  const onRatingChange = async (presetId, newRating) => {
    if (!user) return;
    // Firebaseに保存
    await setRating(user.uid, presetId, newRating);
  };

  const ListItems = (props) => {
    return (
      <tr><td className="number">{props.number}</td><td className="cat">{props.category}</td><td className="name">{props.name}</td>
      <td>
      {
        [1,2,3,4,5].map(star => (
        <span
          key={star}
          style={{ 
            cursor: user ? 'pointer' : 'default',
            color: user ? (star <= getFav(props.id) ? '#f0f0a0' : '#606060') : '#0000',
            fontSize: '1.0rem'
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
          <div id="app_title">Preset Fav [{presetTitle}] 
            <span id="subtitle">sound list easy search tool</span>
          </div>
          <div id="about"> 
            <a href="https://github.com/aike/PresetFav">about</a>
          </div>
          {user ? (
            <div id="userarea">
              <Menu theming="dark" menuButton={<img className="usericon" src={user.photoURL} alt="user" title={user.displayName} />} transition>
                <MenuItem>Export</MenuItem>
                <MenuItem onClick={logout}>Log Out</MenuItem>
              </Menu>  
              </div>
          ) : (
            <div id="userarea">
              <span className="loginout" onClick={signInWithX}>Login</span>
            </div>
          
          )}

        </div>
        <table className="datatable">
          <thead>
            <tr>
              <th id="tab_id" onClick={()=>onSort('id')}>NUMBER<span className="tab_sortmark">{sort.key==='id' ? sort.dir==='asc' ? '▲' : '▼' : '　'}</span></th>
              <th id="tab_cat" onClick={()=>onSort('category')}>CATEGORY<span className="tab_sortmark">{sort.key==='category' ? sort.dir==='asc' ? '▲' : '▼' : '　'}</span></th>
              <th id="tab_name" onClick={()=>onSort('name')}>NAME<span className="tab_sortmark">{sort.key==='name' ? sort.dir==='asc' ? '▲' : '▼' : '　'}</span></th>
            {user ? (<th id="tab_fav" onClick={()=>onSort('fav')}>FAVORITE<span className="tab_sortmark">{sort.key==='fav' ? sort.dir==='asc' ? '▲' : '▼' : '　'}</span></th>) : (<th id="tab_star" style={{color:"gray"}}>FAVORITE (need login)</th>)}
            </tr>
          </thead>
          <tbody>
            {showList &&
            filteredList.map((preset) => <ListItems key={preset.id} id={preset.id} number={preset.number} name={preset.name} category={preset.category} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
