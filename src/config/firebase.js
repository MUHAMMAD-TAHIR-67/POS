// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import {  enableIndexedDbPersistence, getFirestore,  } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  
};
console.log(process.env.REACT_APP_FIREBASE_PROJECT_ID);


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);


try {
  // Enable offline persistence
  enableIndexedDbPersistence(firestore)
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.log('Multiple tabs open, offline persistence is not supported');
      } else if (err.code === 'unimplemented') {
        console.log('This browser does not support offline persistence');
      }
    });
} catch (error) {
  console.log('Error enabling persistence:', error);
}

export { analytics, auth, firestore, storage }
