"use client";

import type { Swiper as SwiperClass } from "swiper";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { backgroundFor } from "@/lib/random";
import type { IndexedMoment } from "@/types";

import MomentSlide from "./MomentSlide";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type Props = {
    blockId: number;
    moments: IndexedMoment[];
    hasNewerBlock: boolean;
    myUid: string;
    partnerUid: string;
    displayNames: Record<string, string>;
    onViewReview: (moment: IndexedMoment, uid: string) => void;
    onAddReview: (moment: IndexedMoment) => void;
    onEditMoment: (moment: IndexedMoment) => void;
    /** Entrega la instancia de Swiper al padre para poder controlarla desde fuera. */
    onSwiperReady: (blockId: number, swiper: SwiperClass) => void;
};

function scrollToBlock(blockId: number) {
    document.getElementById(`container${blockId}`)?.scrollIntoView({ behavior: "smooth" });
}

const ARROW_DOWN =
    "M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z";
const ARROW_UP =
    "M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z";

/** Botón circular blanco de navegación entre bloques. */
function ScrollButton({
    path,
    position,
    onClick,
    visible
}: {
    path: string;
    position: string;
    onClick: () => void;
    visible: boolean;
}) {
    return (
        <a
            className={`absolute bottom-0 ${position} p-1 m-1 opacity-60 ${visible ? "" : "invisible"}`}
            style={{ zIndex: 999 }}
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
        >
            <button
                type="button"
                style={{ backgroundColor: "white" }}
                className="relative align-middle select-none font-sans font-medium text-center uppercase transition-all disabled:pointer-events-none w-8 max-w-[40px] h-8 max-h-[40px] text-xs text-blue-gray-900 shadow-md rounded-full"
            >
                <span className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512">
                        <path d={path} />
                    </svg>
                </span>
            </button>
        </a>
    );
}

export default function TimelineBlock({
    blockId,
    moments,
    hasNewerBlock,
    myUid,
    partnerUid,
    displayNames,
    onViewReview,
    onAddReview,
    onEditMoment,
    onSwiperReady
}: Props) {
    return (
        <div className="container h-screen relative" id={`container${blockId}`}>
            <div className="timeline">
                {/*
                  Flecha abajo -> bloque anterior (más antiguo), que está debajo.
                  Siempre visible: el hero es container0, así que desde el bloque 1
                  esta misma flecha te devuelve al inicio sin ningún caso especial.
                */}
                <ScrollButton
                    path={ARROW_DOWN}
                    position="right-0"
                    visible
                    onClick={() => scrollToBlock(blockId - 1)}
                />
                {/* Flecha arriba -> bloque siguiente (más reciente), que está encima. */}
                <ScrollButton
                    path={ARROW_UP}
                    position="left-0"
                    visible={hasNewerBlock}
                    onClick={() => scrollToBlock(blockId + 1)}
                />

                <Swiper
                    className="h-screen"
                    onSwiper={(swiper) => onSwiperReady(blockId, swiper)}
                    modules={[Navigation, Pagination]}
                    direction="horizontal"
                    loop={false}
                    speed={1600}
                    // El original pedía initialSlide 5 y Swiper lo recortaba
                    // al último slide del bloque. Lo dejamos explícito.
                    initialSlide={moments.length - 1}
                    navigation
                    pagination={{
                        type: "bullets",
                        clickable: true,
                        renderBullet: (index, className) =>
                            `<span class="${className}">${moments[index]?.visualIndex ?? ""}</span>`
                    }}
                >
                    {moments.map((moment) => (
                        <SwiperSlide
                            key={moment.momentId}
                            style={{ backgroundImage: `url(${backgroundFor(moment.momentId)})` }}
                        >
                            <MomentSlide
                                moment={moment}
                                myUid={myUid}
                                partnerUid={partnerUid}
                                displayNames={displayNames}
                                onViewReview={onViewReview}
                                onAddReview={onAddReview}
                                onEditMoment={onEditMoment}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
}
