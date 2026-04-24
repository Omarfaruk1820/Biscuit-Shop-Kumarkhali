// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDoNd6Dobiju5o59AmYQ8muwIpiqL0_GnQ",
  authDomain: "biscuit-shop-kumarkhali.firebaseapp.com",
  projectId: "biscuit-shop-kumarkhali",
  storageBucket: "biscuit-shop-kumarkhali.firebasestorage.app",
  messagingSenderId: "659285437656",
  appId: "1:659285437656:web:c7ba26e38c1f028312bbad",
  measurementId: "G-4TDJLD7CRX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export default auth;
