import { initializeApp } from "firebase/app";
import {
    getFirestore,
    doc,
    updateDoc
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBZfy3js-AuLcw1jmnTRjWVCQkmv1pUtSU",
    authDomain: "marlove-9b442.firebaseapp.com",
    projectId: "marlove-9b442",
    storageBucket: "marlove-9b442.firebasestorage.app",
    messagingSenderId: "148329779594",
    appId: "1:148329779594:web:8fde6c7449d0ce6dce7873",
    measurementId: "G-CFRRZKFDQL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addMomentIdField() {

    for (let id = 1; id <= 16; id++) {
        try {
            const ref = doc(db, "moments", String(id));

            await updateDoc(ref, {
                feeling: "Feliz"
            });

            console.log(`✅ momentId agregado al documento ${id}`);
        } catch (err) {
            console.error(`❌ Error en documento ${id}`, err);
        }
    }

    console.log("🎉 Migración terminada");
}

addMomentIdField();