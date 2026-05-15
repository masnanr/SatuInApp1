import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

// Support environment variable fallbacks for Vercel/external hosting
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigData.measurementId,
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || (firebaseConfigData as any).firestoreDatabaseId;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Validate Connection to Firestore as per instructions
async function testConnection() {
  try {
    const testDoc = doc(db, 'test', 'connection');
    await getDocFromServer(testDoc);
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is reporting as offline.");
    } else {
      // It might fail because the document doesn't exist, which is fine for a connection test
      console.log("Firebase connection test performed.");
    }
  }
}
testConnection();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Login Error:', error);
    throw error;
  }
};
