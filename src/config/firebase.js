// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import {  enableIndexedDbPersistence, getFirestore,  } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyALDTZWI_pj16KOLuonegVDZvxQaBdR2_U",
  authDomain: "react-firebase-600a2.firebaseapp.com",
  projectId: "react-firebase-600a2",
  storageBucket: "react-firebase-600a2.appspot.com",
  messagingSenderId: "817324986643",
  appId: "1:817324986643:web:34cb2eb42f95c8c4f90ae6",
  measurementId: "G-S97DG75M8L"
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