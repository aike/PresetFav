import React, { useEffect, useState } from 'react';
import { auth, signInWithGoogle, logout, setRating, subscribeUserRatings } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { PRESETS } from './presets';

function App() {
  const [user, setUser] = useState(null);
  // ユーザーが付けたレーティングを格納するオブジェクト。 { presetId: { rating: number, updatedAt: ... }, ...}
  const [userRatings, setUserRatings] = useState({});

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
    return () => unsubAuth();
  }, []);

  const handleRatingChange = async (presetId, newRating) => {
    if (!user) return;
    // Firebaseに保存
    await setRating(user.uid, presetId, newRating);
  };

  return (
    <div style={{ margin: '2rem' }}>
      <h1>プリセットレーティングアプリ</h1>

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
      <ul>
        {PRESETS.map((preset) => {
          const ratingData = userRatings[preset.id] || {};
          const currentRating = ratingData.rating || 0;  // デフォルト0
          
          return (
            <li key={preset.id} style={{ marginBottom: '1rem' }}>
              <div>
                <strong>{preset.name}</strong> 
                {/* タグの表示 */}
                <span style={{ marginLeft: '1rem', color: 'gray' }}>[{preset.tags.join(', ')}]</span>
              </div>
              <div>
                {/* ★レーティングUI(簡易版) */}
                {[1,2,3,4,5].map(star => (
                  <span
                    key={star}
                    style={{ 
                      cursor: user ? 'pointer' : 'default',
                      color: star <= currentRating ? 'gold' : 'lightgray',
                      fontSize: '1.5rem'
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
    </div>
  );
}

export default App;
