"use client";

import { formatDate, formatSecondaryDate, averageRating } from "@/lib/format";
import type { IndexedMoment, Participant } from "@/types";

import MomentImage from "./MomentImage";
import MomentSide from "./MomentSide";
import Rating from "./Rating";

type Props = {
    moment: IndexedMoment;
    myUid: string;
    partnerUid: string;
    displayNames: Record<string, string>;
    onViewReview: (moment: IndexedMoment, uid: string) => void;
    onAddReview: (moment: IndexedMoment) => void;
    onEditMoment: (moment: IndexedMoment) => void;
};

export default function MomentSlide({
    moment,
    myUid,
    partnerUid,
    displayNames,
    onViewReview,
    onAddReview,
    onEditMoment
}: Props) {
    // El lado izquierdo es siempre quien creó el momento.
    const ownerUid = moment.createdBy;
    const otherUid = ownerUid === myUid ? partnerUid : myUid;

    const owner: Participant | null = moment.participants?.[ownerUid] ?? null;
    const other: Participant | null = moment.participants?.[otherUid] ?? null;

    const ownerName = (owner?.name ?? displayNames[ownerUid] ?? "").toLowerCase();
    const otherName = (other?.name ?? displayNames[otherUid] ?? "").toLowerCase();

    const average = averageRating(owner?.rating ?? null, other?.rating ?? null);
    const isMyMoment = ownerUid === myUid;

    // Ojo: esto es el CONTENIDO del slide. El <SwiperSlide> lo pone TimelineBlock,
    // porque swiper/react exige que sean hijos directos de <Swiper>.
    return (
        <div className="swiper-slide-content">
                {isMyMoment && (
                    <button
                        type="button"
                        className="z-1000 btn btn-ghost btn-xs top-0 left-0 absolute"
                        onClick={() => onEditMoment(moment)}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487l1.687-1.687a2.25 2.25 0 113.182 3.182L10.582 17.13a4.5 4.5 0 01-1.897 1.13l-2.685.895.895-2.685a4.5 4.5 0 011.13-1.897L16.862 4.487z"
                            />
                        </svg>
                        Editar
                    </button>
                )}

                <span className="timeline-year">{formatDate(moment.timestamp)}</span>
                <p className="text-xs text-white/80">{formatSecondaryDate(moment.timestamp)}</p>
                <h4 className="timeline-title px-6">{moment.title}</h4>

                <MomentImage moment={moment} />

                {/*
                  Sin leyenda de cuántas reseñas componen la nota: cuando falta
                  una, el avatar en gris de más abajo ya lo dice.
                */}
                <div className="flex my-1 items-center justify-center mx-auto">
                    <Rating name={`rating-${moment.momentId}`} value={average} />
                </div>

                <div className="my-1 flex flex-wrap flex-col items-center justify-center gap-1">
                    <button type="button" className="btn btn-ghost btn-xs rounded-full">
                        <span className="opacity-90">📍</span>
                        <span>{moment.place}</span>
                    </button>

                    {moment.song && (
                        <div className="tooltip" data-tip="Abrir en Spotify">
                            <a
                                className="btn btn-ghost btn-xs rounded-full gap-1.5"
                                href={moment.song.url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {moment.song.image ? (
                                    <img
                                        src={moment.song.image}
                                        alt=""
                                        className="h-5 w-5 rounded object-cover"
                                    />
                                ) : (
                                    <span className="opacity-90">🎵</span>
                                )}
                                <span>{moment.song.name}</span>
                                <span className="opacity-60">· {moment.song.artist}</span>
                            </a>
                        </div>
                    )}

                    {/*
                      Mismo tratamiento que el lugar y la canción: antes era una
                      píldora grande y sólida, y acababa siendo lo primero que
                      veía el ojo justo con el dato más privado del momento.
                    */}
                    {moment.sex > 0 && (
                        <div className="tooltip" data-tip="Momentos íntimos ese día">
                            <span className="btn btn-ghost btn-xs rounded-full">
                                <span className="opacity-90">❤️</span>
                                <span>{moment.sex}</span>
                            </span>
                        </div>
                    )}
                </div>

                <div className="my-1 p-3 grid grid-cols-2">
                    <MomentSide
                        name={ownerName}
                        seed={moment.momentId}
                        participant={owner}
                        isMine={ownerUid === myUid}
                        onViewReview={() => onViewReview(moment, ownerUid)}
                        onAddReview={() => onAddReview(moment)}
                    />
                    <MomentSide
                        name={otherName}
                        seed={moment.momentId + 1}
                        participant={other}
                        isMine={otherUid === myUid}
                        onViewReview={() => onViewReview(moment, otherUid)}
                        onAddReview={() => onAddReview(moment)}
                    />
                </div>
            </div>
    );
}
