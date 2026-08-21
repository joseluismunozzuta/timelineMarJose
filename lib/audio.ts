/** Formatos que MediaRecorder puede dar, en orden de preferencia. */
const RECORDING_MIME_TYPES = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4", // Safari en iOS
    "audio/ogg;codecs=opus"
];

/** Frecuencia de muestreo del WAV que se manda a Gemini. Voz: 16 kHz sobra. */
const TARGET_SAMPLE_RATE = 16000;

/** Formato que este navegador puede grabar, o null si no soporta ninguno. */
export function pickRecordingMimeType(): string | null {
    if (typeof MediaRecorder === "undefined") return null;

    return RECORDING_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

/** Extensión de archivo para guardar en Storage. */
export function extensionForMimeType(mimeType: string): string {
    if (mimeType.includes("mp4")) return "m4a";
    if (mimeType.includes("ogg")) return "ogg";
    return "webm";
}

/**
 * Convierte la grabación a WAV mono de 16 kHz.
 *
 * Gemini documenta wav, mp3, aiff, aac, ogg y flac, pero MediaRecorder produce
 * webm (Chrome) o mp4 (Safari), que no están en esa lista. En vez de depender
 * de que funcionen igualmente, se decodifica y se reescribe como WAV, que sí
 * está soportado en todos los casos.
 *
 * El archivo que se guarda en Storage sigue siendo el original comprimido;
 * este WAV es solo para la llamada al modelo.
 */
export async function toWavMono16k(blob: Blob): Promise<Blob> {
    const arrayBuffer = await blob.arrayBuffer();

    const decodeContext = new AudioContext();
    let decoded: AudioBuffer;

    try {
        decoded = await decodeContext.decodeAudioData(arrayBuffer);
    } finally {
        decodeContext.close();
    }

    // Un solo canal en el contexto offline mezcla el estéreo a mono, y la
    // frecuencia del contexto hace el remuestreo.
    const offline = new OfflineAudioContext(
        1,
        Math.max(1, Math.ceil(decoded.duration * TARGET_SAMPLE_RATE)),
        TARGET_SAMPLE_RATE
    );

    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();

    const rendered = await offline.startRendering();

    return encodeWav(rendered.getChannelData(0), TARGET_SAMPLE_RATE);
}

/** PCM de 16 bits con cabecera WAV. */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
    const bytesPerSample = 2;
    const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
    const view = new DataView(buffer);

    const writeString = (offset: number, text: string) => {
        for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * bytesPerSample, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true); // tamaño del bloque fmt
    view.setUint16(20, 1, true); // PCM sin comprimir
    view.setUint16(22, 1, true); // canales
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true); // bytes por segundo
    view.setUint16(32, bytesPerSample, true); // alineación de bloque
    view.setUint16(34, 8 * bytesPerSample, true); // bits por muestra
    writeString(36, "data");
    view.setUint32(40, samples.length * bytesPerSample, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        // Recorta a [-1, 1] antes de escalar, para que un pico no dé la vuelta.
        const sample = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += bytesPerSample;
    }

    return new Blob([buffer], { type: "audio/wav" });
}

/** Base64 sin el prefijo "data:...;base64,", que es lo que espera la API. */
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result);
            resolve(result.slice(result.indexOf(",") + 1));
        };
        reader.onerror = () => reject(new Error("No se pudo leer el audio"));
        reader.readAsDataURL(blob);
    });
}

/** "1:07" */
export function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}
