import React, { useEffect, useState } from 'react';
import { auth, signInWithGoogle, logout, setRating, subscribeUserRatings } from './firebase';
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

  const ListItems = (props) => (
    <tr><td className="cat">{props.category}</td><td className="key">{props.keyassign}</td><td className="cmd">{props.command}</td></tr>
  );

  return (
    <div className='App'>
      <h1>Roland MC-101 Presets</h1>

      {/* ログイン/ログアウトUI */}
      {user ? (
        <div>
          <p>ログイン中: {user.displayName} / {user.email}</p>
          <button onClick={logout}>ログアウト</button>
        </div>
      ) : (
        <div>
          <p>ログアウト中</p>
          <button onClick={signInWithGoogle}>Google でログイン</button>
        </div>
      )}

      <hr />

      {/* プリセット一覧表示 */}
      <div className="datatable-container">
        <div className="header-tools">
          <div className="search">
            <input type="search" className="search-input" placeholder="Search..."
              ref={inputRef}
              onChange={(e) => setKeyword(e.target.value)}
              onClick={() => setShowList(true)}
            />
          </div>
          <div id="app_title">ALL YOUR CUBASE ARE BELONG TO US <span id="subtitle">- Cubase Keyassign Easy Search Tool -</span></div>
        </div>        
        <table className="datatable">
          <thead>
            <tr><th id="tab_cath">NUMBER</th><th id="tab_keyh">NAME</th><th id="tab_cmdh">CATEGORY</th></tr>
          </thead>
          <tbody>
            {showList &&
            filteredList.map((preset) => <ListItems key={preset.id} category={preset.number} keyassign={preset.name} command={preset.category} />)}
          </tbody>
        </table>
      </div>
      {/*
      <ul>
        {PRESETS.map((preset) => {
          const ratingData = userRatings[preset.id] || {};
          const currentRating = ratingData.rating || 0;  // デフォルト0
          
          return (
            <li key={preset.id} style={{ marginBottom: '1rem' }}>
              <div>
                {preset.name} 
                {// タグの表示 }
                <span style={{ marginLeft: '1rem', color: 'black' }}>Bank {preset.bank}</span>
                <span style={{ marginLeft: '1rem', color: 'gray' }}>[{preset.tags.join(', ')}]</span>
              </div>
              <div>
                {// ★レーティングUI(簡易版) }
                {[1,2,3,4,5].map(star => (
                  <span
                    key={star}
                    style={{ 
                      cursor: user ? 'pointer' : 'default',
                      color: star <= currentRating ? 'gold' : 'lightgray',
                      fontSize: '1.0rem'
                    }}
                    onClick={() => user && handleRatingChange(preset.id, star)}
                  >
                    ★
                  </span>
                ))}
                <span style={{ marginLeft: '1rem' }}>({currentRating})</span>
              </div>
            </li>
          );
        })}
      </ul>
      */}
    </div>
  );
}

export default App;
