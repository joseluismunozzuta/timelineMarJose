import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBZfy3js-AuLcw1jmnTRjWVCQkmv1pUtSU",
    authDomain: "marlove-9b442.firebaseapp.com",
    projectId: "marlove-9b442",
    storageBucket: "marlove-9b442.firebasestorage.app",
    messagingSenderId: "148329779594",
    appId: "1:148329779594:web:8fde6c7449d0ce6dce7873",
    measurementId: "G-CFRRZKFDQL"
};

// getApps() evita re-inicializar en cada hot reload de Next.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
