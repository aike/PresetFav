import React, { useEffect, useState } from 'react';
import { auth, signInWithX, logout, setRating, subscribeUserRatings } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { PRESETS } from './presets';
import './App.css';

function App() {
  const sortFnA = (a, b, key) => a[key].localeCompare(b[key]);
  const sortFnD = (a, b, key) => b[key].localeCompare(a[key]);

  const [user, setUser] = useState(null);
  const [userRatings, setUserRatings] = useState({});
  const inputRef = React.useRef();
  const [keyword, setKeyword] = useState("");
  const [showList, setShowList] = useState(false);
  const [filteredList, setFilteredList] = useState(PRESETS);
  const [sort, setSort] = useState({ key: 'id', dir: 'asc' });

  const onSort = (key) => {
    let dir = 'asc';
    if (key === sort.key) {
      dir = (sort.dir === 'asc') ? 'dsc' : 'asc';
    }
    setSort({ key: key, dir: dir });
    let sortFn = dir === 'asc' ? sortFnA : sortFnD;
    setFilteredList(filteredList.sort((a, b) => sortFn(a, b, key)));
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
      setFilteredList(PRESETS.sort((a, b) => sortFn(a, b, sort.key)));
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
      setFilteredList(PRESETS.sort((a, b) => sortFn(a, b, sort.key)));
      return ret;
    }

    // 絞り込みとソート
    const result = PRESETS.filter((preset) =>
      (preset.name.toLowerCase().indexOf(searchKeyword) !== -1)
    ).sort((a, b) => sortFn(a, b, sort.key));
    setFilteredList(result.length ? result : [["No Item Found"]]);

    return ret;
  }, [keyword]);

  const handleRatingChange = async (presetId, newRating) => {
    if (!user) return;
    // Firebaseに保存
    await setRating(user.uid, presetId, newRating);
  };

  const ListItems = (props) => {
    const ratingData = userRatings[props.id] || {};
    const currentRating = ratingData.rating || 0;  // デフォルト0
    return (
      <tr key={props.id}><td className="number">{props.number}</td><td className="name">{props.name}</td><td className="cat">{props.category}</td>
      <td>
      {
        [1,2,3,4,5].map(star => (
        <span
          key={star}
          style={{ 
            cursor: user ? 'pointer' : 'default',
            color: user ? (star <= currentRating ? '#f0f0a0' : '#606060') : '#0000',
            fontSize: '1.0rem'
          }}
          onClick={() => user && handleRatingChange(props.id, star)}
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
          <div id="app_title">Preset Fav [MC-101] 
            <span id="subtitle">Easy Search Tool</span>
          </div>
          {user ? (
            <div id="userarea">
              <img className="usericon" src={user.photoURL} alt="user" title={user.displayName} />
              <span className="loginout" onClick={logout}>Logout</span>
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
              <th id="tab_cath" onClick={()=>onSort('id')}>NUMBER {sort.key==='id' ? sort.dir==='asc' ? '▲' : '▼' : ''}</th>
              <th id="tab_keyh" onClick={()=>onSort('name')}>NAME {sort.key==='name' ? sort.dir==='asc' ? '▲' : '▼' : ''}</th>
              <th id="tab_cmdh" onClick={()=>onSort('category')}>CATEGORY {sort.key==='category' ? sort.dir==='asc' ? '▲' : '▼' : ''}</th>
            {user ? (<th id="tab_star">FAVORITE</th>) : (<th id="tab_star" style={{color:"gray"}}>FAVORITE (need login)</th>)}
            </tr>
          </thead>
          <tbody>
            {showList &&
            filteredList.map((preset) => <ListItems id={preset.id} number={preset.number} name={preset.name} category={preset.category} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
