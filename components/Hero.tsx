"use client";

import { useHeroBackground } from "@/hooks/useHeroBackground";

import Countdown from "./Countdown";

/** Fecha en que empezó la historia. */
const TIMELINE_START = "2026-01-15T16:17:00";

const HERO_IMAGES = Array.from({ length: 9 }, (_, i) => `/assets/img/hero${i + 1}.jpg`);

/** Cada cuánto cambia la foto de fondo. */
const BACKGROUND_INTERVAL_MS = 3000;

type Props = {
    /** Título de la pareja. Cae al de siempre si el documento no lo trae. */
    title?: string | null;
    /** Nombres de los dos miembros, para la firma. */
    names?: string[];
    onNewMoment: () => void;
    onLogout: () => void;
    onGoToStart: () => void;
};

export default function Hero({ title, names = [], onNewMoment, onLogout, onGoToStart }: Props) {
    const backgroundLayers = useHeroBackground(HERO_IMAGES, BACKGROUND_INTERVAL_MS);

    const byline = names.length ? names.join(" & ") : null;

    return (
        <section id="appView">
            {/*
              min-h-[100svh] y no h-screen: en móvil, 100vh incluye la barra del
              navegador y el contenido queda cortado hasta que se oculta.
            */}
            <div
                id="container0"
                className="relative flex min-h-[100svh] flex-col overflow-hidden"
            >
                {/*
                  Fotos de fondo. Como mucho hay dos capas a la vez: la anterior
                  abajo y la nueva encima entrando con el fundido, que es lo que
                  produce el cruce.
                */}
                {backgroundLayers.map((layer, i) => (
                    <div
                        key={layer.id}
                        className={`absolute inset-0 bg-cover bg-center ${
                            i === backgroundLayers.length - 1 ? "hero-bg-fade" : ""
                        }`}
                        style={{ backgroundImage: `url(${layer.src})` }}
                    />
                ))}

                {/*
                  Mismo velo que los slides de la timeline: oscuro arriba y abajo
                  (donde va el texto), más suave en el centro para que la foto
                  siga viéndose.
                */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(to bottom, rgba(0,0,0,.8) 0%, rgba(0,0,0,.55) 30%, rgba(0,0,0,.5) 55%, rgba(0,0,0,.75) 85%, rgba(0,0,0,.9) 100%)"
                    }}
                />

                <button
                    type="button"
                    onClick={onLogout}
                    className="absolute right-3 top-3 z-20 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs text-white/80 backdrop-blur-md transition-colors hover:bg-black/50 hover:text-white"
                >
                    {/*
                      El padding es simétrico, pero la caja de línea reserva 3px
                      de descendente que "Cerrar sesión" no usa: no lleva ninguna
                      letra que baje de la línea base. Eso deja la tinta 1px baja.
                      Medio píxel arriba lo centra exacto (8.5px por lado).
                    */}
                    <span className="inline-block -translate-y-[0.5px]">Cerrar sesión</span>
                </button>

                <div className="relative z-10 flex flex-1 flex-col justify-between px-6 pb-8 pt-16 text-center text-white">
                    {/* Cabecera */}
                    <header className="space-y-3">
                        <h1 className="text-4xl font-bold leading-tight drop-shadow-lg sm:text-5xl">
                            {title || "Nuestros recuerdos"}
                            <span className="ml-1">❤️</span>
                        </h1>

                        {byline && (
                            <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">
                                {byline}
                            </p>
                        )}

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={onNewMoment}
                                className="rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
                            >
                                Registrar nuevo momento
                            </button>
                        </div>
                    </header>

                    {/* Contador + cierre */}
                    <div className="mx-auto w-full max-w-sm space-y-5">
                        <div className="space-y-3">
                            <p className="text-[11px] uppercase tracking-[0.25em] text-white/60">
                                Nuestro amor comenzó hace
                            </p>
                            <Countdown since={TIMELINE_START} />
                        </div>

                        <p className="text-sm leading-relaxed text-white/75">
                            Aquí guardaremos para siempre esos momentos que tanto amamos compartir,
                            desde el primer día que nos vimos ❤️
                        </p>

                        <button
                            type="button"
                            onClick={onGoToStart}
                            className="w-full rounded-full bg-pink-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-pink-900/40 transition-colors hover:bg-pink-500"
                        >
                            Donde todo empezó ❤️
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
