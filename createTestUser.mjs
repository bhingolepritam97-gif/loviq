import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as geofire from "geofire-common";

const firebaseConfig = {
  apiKey: "AIzaSyAKI9IAchNbjtx1LxzfloXkCSm5zbost2o",
  authDomain: "loviq-33ac0.firebaseapp.com",
  projectId: "loviq-33ac0",
  storageBucket: "loviq-33ac0.firebasestorage.app",
  messagingSenderId: "627555697682",
  appId: "1:627555697682:web:d2ae681b3f983a8a1784cb",
  measurementId: "G-J1W86JB7S2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const createTestProfile = async () => {
  const email = "sarah.realtime@example.com";
  const password = "password123";
  
  try {
    console.log("Creating or signing into user account...");
    let user;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } else {
        throw e;
      }
    }
    console.log(`User UID: ${user.uid}`);
    
    // Default coords (San Francisco)
    const lat = 37.7749;
    const lng = -122.4194;
    const hash = geofire.geohashForLocation([lat, lng]);

    console.log("Creating profile document...");
    const profileRef = doc(db, 'profiles', user.uid);
    await setDoc(profileRef, {
      name: "Sarah",
      age: 26,
      gender: "Woman",
      interestedIn: "Everyone",
      bio: "Just looking for someone to test real-time updates with! 🚀",
      job: "QA Engineer",
      photos: ["https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1000"],
      location: {
        latitude: lat,
        longitude: lng,
        geohash: hash
      },
      distance_range: 50,
      age_range: [18, 50],
      eloScore: 1500,
      createdAt: new Date().toISOString()
    });

    console.log("Test user created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating test user:", error);
    process.exit(1);
  }
};

createTestProfile();
