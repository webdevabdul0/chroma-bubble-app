import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyC-02P_k2Qq59kP5WpMAZAu9owP0JD_21Q",
  authDomain: "chat-bubble-60947.firebaseapp.com",
  projectId: "chat-bubble-60947",
  storageBucket: "chat-bubble-60947.firebasestorage.app",
  messagingSenderId: "708983056343",
  appId: "1:708983056343:web:e3b7ff5e55df839b170d92",
  measurementId: "G-M93F3L1WDG"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); 