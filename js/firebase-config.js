// ========================================
// FIREBASE-CONFIG.JS - Firebase Configuration
// ========================================

console.log("🔥 Initializing Firebase...");

// Use latest Firebase modular SDK (v10.13.2 for stability)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  updateDoc,    
  doc,
  getCountFromServer,
  orderBy,
  limit,
  deleteDoc  
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDz82pR8baoyqNyB9zXFmBdOTpR3SJzIcM",
  authDomain: "lost-and-found-dekut.firebaseapp.com",
  projectId: "lost-and-found-dekut",
  storageBucket: "lost-and-found-dekut.firebasestorage.app",
  messagingSenderId: "1090599283019",
  appId: "1:1090599283019:web:8c0d6583641439a9ea60ce"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

console.log("✅ Firebase initialized successfully!");

// Export all necessary modules for other files
export { 
  db, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  updateDoc,    
  doc,
  getCountFromServer,
  orderBy,
  limit,
  deleteDoc  
};