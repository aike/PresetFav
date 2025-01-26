import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, TwitterAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Googleログイン
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};

// Googleログイン
export const signInWithX = async () => {
  const provider = new TwitterAuthProvider();
  await signInWithPopup(auth, provider);
};

// ログアウト
export const logout = async () => {
  await signOut(auth);
};

// レーティング保存
export const setRating = async (uid, presetId, rating) => {
  const ref = doc(db, 'fav', uid, 'favs', presetId);
  if (rating === 0) {
    await deleteDoc(ref);
    return;
  } else {
    await setDoc(ref, {
      rating: rating
    }, { merge: true });
  }
};

// リスナー (ユーザーのレーティング全件を取得)
export const subscribeUserRatings = (uid, callback) => {
  const ratingsRef = collection(db, 'fav', uid, 'favs');
  return onSnapshot(ratingsRef, (snapshot) => {
    const data = {};
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });
    callback(data); // { "p001": { rating: 3, ...}, "p005": { rating: 5, ...} }
  });
};
