// seed-couple-moments.mjs
import { initializeApp } from "firebase/app";
import {
    getFirestore,
    doc,
    writeBatch,
    Timestamp,
    serverTimestamp,
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
function randomDateBetween(start, end) {
    const startMs = start.getTime();
    const endMs = end.getTime();
    const ms = randInt(startMs, endMs);
    return new Date(ms);
}

// ====== CONFIG NUEVA ESTRUCTURA ======
const COUPLE_ID = "couple_mar_jose";     // tu doc en /couples
const UID_JOSE = 111;            // cámbialo por el uid real de José
const UID_MAR = 112;              // cámbialo por el uid real de Mar

async function seedCoupleAndMoments() {
    const places = [
        "Parque María Reiche",
        "Malecón de Miraflores",
        "Costa Verde",
        "Larcomar",
        "Parque Kennedy",
        "Barranco - Puente de los Suspiros",
        "San Isidro - El Olivar",
        "Museo Larco",
        "Plaza San Miguel",
        "Centro de Lima",
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
        "Heladito y paseo 🍦",
        "Conversación profunda 🥹",
    ];

    const feelings = [
        "FELIZ",
        "ENAMORADO",
        "ENAMORADA",
        "TRANQUILO",
        "TRANQUILA",
        "EMOCIONADO",
        "EMOCIONADA",
        "NERVIOSO",
        "NERVIOSA",
        "AGRADECIDO",
        "AGRADECIDA",
    ];

    // Rango de fechas para pruebas (enero-marzo 2026)
    const start = new Date("2026-01-01T00:00:00-05:00");
    const end = new Date("2026-03-31T23:59:59-05:00");

    const batch = writeBatch(db);

    // 1) Crea/actualiza doc de pareja
    const coupleRef = doc(db, "couples", COUPLE_ID);
    batch.set(
        coupleRef,
        {
            members: [UID_JOSE, UID_MAR],
            createdAt: serverTimestamp(),
            // opcional (útil para UI)
            displayNames: {
                [UID_JOSE]: "Jose",
                [UID_MAR]: "Mar",
            },
        },
        { merge: true } // por si ya existe
    );

    // 2) Crear 20 momentos: couples/{coupleId}/moments/{momentId}
    for (let momentId = 1; momentId <= 20; momentId++) {
        const momentRef = doc(db, "couples", COUPLE_ID, "moments", String(momentId));

        // Decide si en este seed ambos escriben o solo uno (para probar tu lógica)
        const bothWrite = Math.random() < 0.65; // 65% ambos, 35% solo uno
        const joseWrites = true;                // José siempre escribe (puedes randomizar)
        const marWrites = bothWrite;            // Mar escribe a veces

        const participants = {};

        if (joseWrites) {
            participants[UID_JOSE] = {
                name: "Jose",
                description: `momento ${momentId} (Jose)`,
                rating: randInt(1, 5),
                feeling: pick(feelings),
                updatedAt: serverTimestamp(),
            };
        }

        if (marWrites) {
            participants[UID_MAR] = {
                name: "Mar",
                description: `momento ${momentId} (Mar)`,
                rating: randInt(1, 5),
                feeling: pick(feelings),
                updatedAt: serverTimestamp(),
            };
        }

        const data = {
            momentId, // ✅ numérico
            title: `${pick(titles)} (#${momentId})`,
            place: pick(places),
            sex: randInt(0, 1),
            timestamp: Timestamp.fromDate(randomDateBetween(start, end)),

            // extra útil para backend/UI
            createdAt: serverTimestamp(),
            createdBy: UID_JOSE,

            // ✅ por participante
            participants,
        };

        // OJO: batch.set sobrescribe el doc del momento si ya existe
        batch.set(momentRef, data);
    }

    await batch.commit();
    console.log("✅ Seed completado: couple + 20 moments creados/actualizados.");
    console.log(
        `Ruta: couples/${COUPLE_ID}/moments/{1..20} (participants por UID)`
    );
}

seedCoupleAndMoments().catch((err) => {
    console.error("❌ Error en seed:", err);
    process.exit(1);
});