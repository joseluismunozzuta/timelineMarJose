"use client";

import type { Swiper as SwiperClass } from "swiper";

import type { IndexedMoment } from "@/types";
import TimelineBlock from "./TimelineBlock";

type Props = {
    blocks: IndexedMoment[][];
    myUid: string;
    partnerUid: string;
    displayNames: Record<string, string>;
    onViewReview: (moment: IndexedMoment, uid: string) => void;
    onAddReview: (moment: IndexedMoment) => void;
    onEditMoment: (moment: IndexedMoment) => void;
    onSwiperReady: (blockId: number, swiper: SwiperClass) => void;
};

export default function Timeline({ blocks, ...handlers }: Props) {
    // El orden del DOM va del bloque más reciente (arriba) al más antiguo
    // (abajo), igual que el insertBefore del código original.
    const blocksTopDown = blocks
        .map((moments, i) => ({ blockId: i + 1, moments }))
        .reverse();

    return (
        <section id="slides_section">
            {blocksTopDown.map(({ blockId, moments }) => (
                <TimelineBlock
                    key={blockId}
                    blockId={blockId}
                    moments={moments}
                    hasNewerBlock={blockId < blocks.length}
                    {...handlers}
                />
            ))}
        </section>
    );
}
