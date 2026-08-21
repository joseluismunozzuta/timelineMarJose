/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const cors = require("cors")({ origin: true });
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.spotifySearch = onRequest(async (req, res) => {

    cors(req, res, async () => {

        const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
        const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

        const query = req.query.q;

        if (!query) {
            res.status(400).json([]);
            return;
        }

        try {

            const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization:
                        "Basic " +
                        Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
                },
                body: "grant_type=client_credentials",
            });

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            const searchResponse = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=6`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            const data = await searchResponse.json();

            const tracks = data.tracks.items.map((t) => ({
                id: t.id,
                name: t.name,
                artist: t.artists.map(a => a.name).join(", "),
                image: t.album.images[0]?.url,
                url: t.external_urls.spotify
            }));

            res.json(tracks);

        } catch (err) {
            console.error(err);
            res.status(500).json([]);
        }

    });

});

// ---------------------------------------------------------------------------
// Transcripción de audio con Gemini
// ---------------------------------------------------------------------------

const admin = require("firebase-admin");

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Alias que apunta siempre al Flash vigente, en vez de un id con versión.
 *
 * Con ids fijos esto ya se rompió una vez: gemini-2.5-flash seguía apareciendo
 * en el listado de /models pero devolvía 404 en proyectos nuevos ("no longer
 * available to new users"). El alias evita tener que vigilar las deprecaciones.
 *
 * A cambio, el modelo puede cambiar bajo los pies sin avisar. Si algún día
 * interesa fijarlo, basta poner GEMINI_MODEL en functions/.env.
 */
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

/**
 * Instrucciones para el modelo.
 *
 * Los nombres de la pareja van dentro a propósito: sin ellos, "Mar" se
 * transcribe como la palabra común ("el mar", "fuimos al mar") porque es
 * un sustantivo del diccionario.
 */
function buildPrompt(names) {
    const people = names.length ? names.join(" y ") : "la pareja";

    return [
        "Eres un asistente que convierte una nota de voz en una descripción escrita",
        "para una línea de tiempo de recuerdos de una pareja.",
        "",
        `Las personas de esta pareja se llaman: ${people}.`,
        "Trata esos nombres SIEMPRE como nombres propios, aunque coincidan con",
        "palabras comunes del español. Escríbelos con mayúscula inicial.",
        "",
        "Instrucciones:",
        "- Escribe en primera persona, como habla la persona del audio.",
        "- Solo transcribe lo que dice el audio. No incluyas nada que no se diga en el audio.",
        "- Conserva su tono y las cosas concretas que menciona. No inventes datos,",
        "  lugares, fechas ni sentimientos que no estén en el audio.",
        "- Corrige muletillas, repeticiones y frases cortadas. No transcribas literal.",
        "- Añade algunos emojis donde encajen de forma natural. Sin exagerar.",
        "- Español. Entre 2 y 5 frases.",
        "- Devuelve SOLO el texto final, sin comillas, sin encabezados y sin explicaciones.",
        "",
        "Si el audio está vacío o no se entiende nada, responde exactamente: SIN_AUDIO"
    ].join("\n");
}

/**
 * Comprueba el ID token de Firebase. Sin esto, cualquiera podría gastar la cuota.
 *
 * Acepta el token en Authorization: Bearer o en x-firebase-token. La segunda
 * existe por si alguna vez el control de acceso de Cloud Run se interpone con
 * la primera; hoy no lo hace, pero así el cliente puede usar cualquiera de las
 * dos sin que importe el orden de despliegue.
 */
async function getAuthenticatedUid(req) {
    const authHeader = req.headers.authorization || "";

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : req.headers["x-firebase-token"];

    if (!token) return null;

    try {
        const decoded = await admin.auth().verifyIdToken(String(token));
        return decoded.uid;
    } catch (err) {
        logger.warn("Token inválido", err);
        return null;
    }
}

/** Códigos que Google documenta como temporales: reintentar tiene sentido. */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

/**
 * Llama a Gemini reintentando los errores temporales con espera creciente.
 *
 * El 503 ("high demand") es habitual y se resuelve solo en segundos; sin
 * reintentos, cada pico de carga de Google se convertía en un error para el
 * usuario justo después de grabar.
 */
async function callGemini(url, payload) {
    let last = { status: 0, detail: "" };

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) return { ok: true, data: await response.json() };

        last = { status: response.status, detail: await response.text() };

        const isLastAttempt = attempt === MAX_ATTEMPTS;
        if (!RETRYABLE_STATUSES.has(response.status) || isLastAttempt) break;

        const waitMs = 1000 * 2 ** (attempt - 1); // 1s, 2s
        logger.warn(`Gemini ${response.status}; reintento ${attempt}/${MAX_ATTEMPTS} en ${waitMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    return { ok: false, ...last, retryable: RETRYABLE_STATUSES.has(last.status) };
}

exports.transcribeMoment = onRequest({ timeoutSeconds: 120 }, async (req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") {
            res.status(405).json({ error: "Usa POST" });
            return;
        }

        const uid = await getAuthenticatedUid(req);
        if (!uid) {
            res.status(401).json({ error: "No autenticado" });
            return;
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            logger.error("Falta GEMINI_API_KEY en el entorno");
            res.status(500).json({ error: "Servicio no configurado" });
            return;
        }

        const { audioBase64, mimeType, names } = req.body || {};

        if (!audioBase64 || !mimeType) {
            res.status(400).json({ error: "Faltan audioBase64 o mimeType" });
            return;
        }

        try {
            const result = await callGemini(
                `${GEMINI_ENDPOINT}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
                {
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { text: buildPrompt(Array.isArray(names) ? names : []) },
                                { inline_data: { mime_type: mimeType, data: audioBase64 } }
                            ]
                        }
                    ],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
                }
            );

            if (!result.ok) {
                logger.error("Gemini respondió con error", result.status, result.detail);

                // El detalle se devuelve al cliente a propósito: esta app la usan
                // dos personas y poder ver el motivo real en el navegador ahorra
                // tener que ir a los logs cada vez. La respuesta de Gemini no
                // incluye la clave, que viaja en la query de la petición.
                res.status(502).json({
                    error: result.retryable
                        ? "El servicio está saturado ahora mismo. Inténtalo en un momento."
                        : "El servicio de transcripción falló",
                    retryable: result.retryable,
                    status: result.status,
                    detail: String(result.detail).slice(0, 800)
                });
                return;
            }

            const data = result.data;
            const text = data?.candidates?.[0]?.content?.parts
                // Los modelos con razonamiento pueden devolver partes marcadas
                // como thought; esas no son la respuesta.
                ?.filter((part) => !part.thought)
                .map((part) => part.text)
                .filter(Boolean)
                .join("")
                .trim();

            if (!text || text === "SIN_AUDIO") {
                res.status(422).json({ error: "No se entendió el audio" });
                return;
            }

            res.json({ text });
        } catch (err) {
            logger.error("Error llamando a Gemini", err);
            res.status(500).json({ error: "Error procesando el audio" });
        }
    });
});
