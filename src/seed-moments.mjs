// seed-moments.mjs
import { initializeApp } from "firebase/app";
import {
    getFirestore,
    doc,
    writeBatch,
    Timestamp,
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBZfy3js-AuLcw1jmnTRjWVCQkmv1pUtSU",
    authDomain: "marlove-9b442.firebaseapp.com",
    projectId: "marlove-9b442",
    storageBucket: "marlove-9b442.firebasestorage.app",
    messagingSenderId: "148329779594",
    appId: "1:148329779594:web:8fde6c7449d0ce6dce7873",
    measurementId: "G-CFRRZKFDQL",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
}

/**
 * Fecha random entre dos fechas, interpretadas como UTC-5 (Lima).
 * En JS no existe "UTC-5" fijo sin librerías, pero para data de prueba está OK.
 * Si quieres exactitud de zona horaria, te lo adapto con luxon.
 */
function randomDateBetween(start, end) {
    const startMs = start.getTime();
    const endMs = end.getTime();
    const ms = randInt(startMs, endMs);
    return new Date(ms);
}

async function seedMoments() {
    const places = [
        "Parque María Reiche",
        "Malecón de Miraflores",
        "Costa Verde",
        "Larcomar",
        "Parque Kennedy",
        "Barranco - Puente de los Suspiros",
        "San Isidro - El Olivar",
        "Museo Larco",
    ];

    const titles = [
        "Un día random pero bonito ✨",
        "Cita improvisada 😅",
        "Caminata y charla ❤️",
        "Risas sin parar 😂",
        "Momento tranquilo 🌙",
        "Foto espontánea 📸",
        "Plan simple, feliz 🫶",
        "Atardecer juntos 🌅",
    ];

    // Rango de fechas para pruebas (enero-febrero 2026)
    const start = new Date("2026-01-01T00:00:00-05:00");
    const end = new Date("2026-02-27T23:59:59-05:00");

    const batch = writeBatch(db);

    for (let id = 2; id <= 16; id++) {
        const data = {
            descriptionjose: `momento ${id}`,
            place: pick(places),
            ratingjose: randInt(1, 5),
            sex: randInt(0, 1), // 0 o 1 (ajústalo si manejas otro rango)
            timestamp: Timestamp.fromDate(randomDateBetween(start, end)),
            title: `${pick(titles)} (#${id})`,
        };

        // Documento con ID fijo "2"..."16"
        const ref = doc(db, "moments", String(id));
        batch.set(ref, data); // OJO: sobrescribe si ya existe el doc con ese ID
    }

    await batch.commit();
    console.log("✅ Seed completado: moments (IDs 2..16) creados/actualizados.");
}

seedMoments().catch((err) => {
    console.error("❌ Error sembrando moments:", err);
    process.exit(1);
});