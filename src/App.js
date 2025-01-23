import React, { useEffect, useState } from 'react';
import { auth, signInWithGoogle, signInWithX, logout, setRating, subscribeUserRatings } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { PRESETS } from './presets';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  // ユーザーが付けたレーティングを格納するオブジェクト。 { presetId: { rating: number, updatedAt: ... }, ...}
  const [userRatings, setUserRatings] = useState({});

  const inputRef = React.useRef();
  const [keyword, setKeyword] = useState("");
  const [showList, setShowList] = useState(false);
  const [filteredList, setFilteredList] = useState(PRESETS);

  useEffect(() => {
    // Auth状態を監視
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {

        // 名前の代わりにこの画像を表示する
        console.log(currentUser.photoURL);

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

    if (inputRef.current) {
      const node = inputRef.current;
      node.focus();
      setShowList(true);
    }

    if (keyword === "") {
      setFilteredList(PRESETS);
      return;
    }

    const searchKeyword = keyword
      .trim()
      .toLowerCase();

    if ((searchKeyword.length >= 1) && (searchKeyword.length <= 1)) {
      setFilteredList([]);
      return;
    }
    
    //入力されたキーワードが空白のみの場合
    if (searchKeyword === null) {
      setFilteredList(PRESETS);
      return;
    }

    const result = PRESETS.filter((preset) =>
      (preset.name.toLowerCase().indexOf(searchKeyword) !== -1)
    );
    setFilteredList(result.length ? result : [["No Item Found"]]);

    // TODO: この意味を調べる
    return () => unsubAuth();
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
            <tr><th id="tab_cath">NUMBER</th><th id="tab_keyh">NAME</th><th id="tab_cmdh">CATEGORY</th>
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
