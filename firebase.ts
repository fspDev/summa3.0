import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBCtC6zr9M66ZQUpeojrxXYHLJxZXX51gk",
  authDomain: "soma-app-46345524-37d21.firebaseapp.com",
  projectId: "soma-app-46345524-37d21",
  storageBucket: "soma-app-46345524-37d21.firebasestorage.app",
  messagingSenderId: "399940990133",
  appId: "1:399940990133:web:088e62aeb894e39c43fafc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const dbFirestore = getFirestore(app);