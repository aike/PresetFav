import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, TwitterAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, query, where, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
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

// Xログイン
export const signInWithX = async () => {
  const provider = new TwitterAuthProvider();
  await signInWithPopup(auth, provider);
};

// ログアウト
export const logout = async () => {
  await signOut(auth);
};

// レーティング保存
export const setRating = async (listid, uid, key, rating) => {
  const ref = doc(db, 'fav', uid, 'favs', key);
  if (rating === 0) {
    await deleteDoc(ref);
    return;
  } else {
    await setDoc(ref, {
      rating: rating,
      list: listid
    }, { merge: true });
  }
};

// リスナー (ユーザーのレーティング全件を取得)
export const subscribeUserRatings = (listid, uid, callback) => {
  console.log("listid = " + listid);
  const ratingsRef = collection(db, 'fav', uid, 'favs');
  if (listid === undefined) {
    return onSnapshot(ratingsRef, (snapshot) => {
      const data = {};
      snapshot.forEach(doc => {
        data[doc.id] = doc.data();
      });
      console.log("data length(all) = " + Object.keys(data).length);
      callback(data);
    });  
  }
  const q = query(ratingsRef, where("list", "==", listid));
  return onSnapshot(q, (snapshot) => {
    const data = {};
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });
    console.log("data length(q) = " + Object.keys(data).length);
    callback(data);
  });
};
