"use client";

import { useEffect, useRef, useState } from "react";

import { auth } from "@/lib/firebase";
import { MAX_RECORDING_SECONDS } from "@/lib/constants";
import { transcribeAudio } from "@/lib/moments";
import {
    blobToBase64,
    extensionForMimeType,
    formatDuration,
    pickRecordingMimeType,
    toWavMono16k
} from "@/lib/audio";

export type RecordedAudio = { blob: Blob; extension: string };

type Props = {
    /** Nombres de la pareja: contexto para que el modelo no los confunda. */
    names: string[];
    /** Texto redactado por el modelo, listo para volcarlo en el textarea. */
    onTranscribed: (text: string) => void;
    /** Grabación original; el padre la sube a Storage al guardar. */
    onAudioChange: (audio: RecordedAudio | null) => void;
    /** Nota de voz ya guardada, en modo edición. */
    existingAudioUrl?: string | null;
};

type Status = "idle" | "recording" | "recorded" | "processing";

export default function AudioRecorder({
    names,
    onTranscribed,
    onAudioChange,
    existingAudioUrl
}: Props) {
    const [status, setStatus] = useState<Status>("idle");
    const [seconds, setSeconds] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const blobRef = useRef<Blob | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /** Suelta el micrófono: si no, el indicador del navegador se queda encendido. */
    function releaseMicrophone() {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    }

    function clearTimer() {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
    }

    useEffect(() => {
        return () => {
            clearTimer();
            releaseMicrophone();
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    async function startRecording() {
        setError(null);

        const mimeType = pickRecordingMimeType();
        if (!mimeType) {
            setError("Este navegador no permite grabar audio.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const recorder = new MediaRecorder(stream, { mimeType });
            chunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) chunksRef.current.push(event.data);
            };

            recorder.onstop = () => {
                releaseMicrophone();
                clearTimer();

                const blob = new Blob(chunksRef.current, { type: mimeType });
                blobRef.current = blob;

                setPreviewUrl((current) => {
                    if (current) URL.revokeObjectURL(current);
                    return URL.createObjectURL(blob);
                });

                onAudioChange({ blob, extension: extensionForMimeType(mimeType) });
                setStatus("recorded");
            };

            recorder.start();
            recorderRef.current = recorder;

            setSeconds(0);
            setStatus("recording");

            timerRef.current = setInterval(() => {
                setSeconds((current) => {
                    // Corte automático: evita subidas enormes por un olvido.
                    if (current + 1 >= MAX_RECORDING_SECONDS) stopRecording();
                    return current + 1;
                });
            }, 1000);
        } catch (e) {
            console.error(e);
            releaseMicrophone();
            setError("No se pudo acceder al micrófono. Revisa los permisos.");
        }
    }

    function stopRecording() {
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    }

    function discard() {
        blobRef.current = null;
        onAudioChange(null);

        setPreviewUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return null;
        });

        setSeconds(0);
        setStatus("idle");
        setError(null);
    }

    async function process() {
        const blob = blobRef.current;
        if (!blob) return;

        setStatus("processing");
        setError(null);

        try {
            // Gemini documenta wav/mp3/ogg/flac, pero MediaRecorder da webm o mp4.
            // Se convierte solo para la llamada; en Storage va el original.
            const wav = await toWavMono16k(blob);
            const base64 = await blobToBase64(wav);

            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) throw new Error("Sesión no válida");

            const text = await transcribeAudio(idToken, base64, "audio/wav", names);

            onTranscribed(text);
            setStatus("recorded");
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "No se pudo procesar el audio");
            setStatus("recorded");
        }
    }

    return (
        <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
            {status === "idle" && (
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm text-white transition-colors hover:bg-white/20"
                        onClick={startRecording}
                    >
                        🎙️ Grabar descripción
                    </button>
                    <span className="text-xs text-white/55">
                        Cuéntalo en voz alta y lo escribo por ti
                    </span>
                </div>
            )}

            {status === "recording" && (
                <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
                    </span>

                    <span className="font-mono text-sm tabular-nums text-white">
                        {formatDuration(seconds)}
                    </span>

                    <button type="button" className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-500" onClick={stopRecording}>
                        Detener
                    </button>

                    <span className="text-xs text-white/45">
                        máx. {formatDuration(MAX_RECORDING_SECONDS)}
                    </span>
                </div>
            )}

            {(status === "recorded" || status === "processing") && (
                <div className="space-y-3">
                    {previewUrl && (
                        <audio controls src={previewUrl} className="w-full">
                            Tu navegador no puede reproducir audio.
                        </audio>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="flex items-center gap-2 rounded-full bg-pink-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pink-500 disabled:opacity-50"
                            onClick={process}
                            disabled={status === "processing"}
                        >
                            {status === "processing" ? (
                                <>
                                    <span className="loading loading-spinner loading-xs" />
                                    Procesando...
                                </>
                            ) : (
                                <>✨ Generar descripción</>
                            )}
                        </button>

                        <button
                            type="button"
                            className="rounded-full px-4 py-1.5 text-sm text-white/70 transition-colors hover:text-white"
                            onClick={discard}
                            disabled={status === "processing"}
                        >
                            Descartar
                        </button>
                    </div>
                </div>
            )}

            {status === "idle" && existingAudioUrl && (
                <div className="mt-3 space-y-1">
                    <p className="text-[11px] uppercase tracking-widest text-white/50">Nota de voz guardada</p>
                    <audio controls src={existingAudioUrl} className="w-full" />
                </div>
            )}

            {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        </div>
    );
}
