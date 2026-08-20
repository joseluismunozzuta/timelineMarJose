"use client";

import { useEffect, useState } from "react";

const UNITS = [
    { key: "days", label: "días" },
    { key: "hours", label: "horas" },
    { key: "minutes", label: "min" },
    { key: "seconds", label: "seg" }
] as const;

function elapsedSince(target: number) {
    const distance = Math.max(0, Date.now() - target);

    return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((distance / (1000 * 60)) % 60),
        seconds: Math.floor((distance / 1000) % 60)
    };
}

/**
 * Tiempo transcurrido desde la fecha dada, contando hacia arriba.
 *
 * No usa la clase `countdown` de daisyUI: su animación de rodillo está pensada
 * para valores de 0 a 99 y el contador de días ya va por encima. Números planos
 * con `tabular-nums` para que no bailen al cambiar el segundo.
 */
export default function Countdown({ since }: { since: string }) {
    const target = new Date(since).getTime();
    const [elapsed, setElapsed] = useState(() => elapsedSince(target));

    useEffect(() => {
        const interval = setInterval(() => setElapsed(elapsedSince(target)), 1000);
        return () => clearInterval(interval);
    }, [target]);

    return (
        <div className="grid grid-cols-4 divide-x divide-white/15 overflow-hidden rounded-2xl border border-white/15 bg-black/35 backdrop-blur-md">
            {UNITS.map(({ key, label }) => (
                <div key={key} className="flex flex-col items-center gap-1 px-2 py-3">
                    <span className="font-mono text-3xl font-semibold tabular-nums leading-none text-white sm:text-4xl">
                        {elapsed[key]}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.15em] text-white/55">
                        {label}
                    </span>
                </div>
            ))}
        </div>
    );
}
