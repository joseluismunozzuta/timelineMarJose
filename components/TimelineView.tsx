"use client";

import { useCallback, useRef, useState } from "react";
import type { Swiper as SwiperClass } from "swiper";

import { useAuth } from "@/components/AuthProvider";
import Hero from "@/components/Hero";
import Loader from "@/components/Loader";
import MomentModal, { type MomentDraft } from "@/components/modals/MomentModal";
import ReviewFormModal, { type ReviewDraft } from "@/components/modals/ReviewFormModal";
import ReviewModal from "@/components/modals/ReviewModal";
import Timeline from "@/components/timeline/Timeline";
import { useTimeline } from "@/hooks/useTimeline";
import { createMoment, editMoment, saveReview } from "@/lib/moments";
import type { IndexedMoment } from "@/types";

/** Duración de la animación al deslizar entre slides, igual que el original. */
const SLIDE_SPEED = 1600;

/*
 * Los modales guardan el momentId, no el momento.
 * Con el listener en vivo, una copia del objeto se quedaría obsoleta en cuanto
 * llegara un cambio; el id siempre resuelve a la versión actual.
 */
type ReviewTarget = { momentId: number; reviewerUid: string };
type ReviewFormTarget = { momentId: number; mode: "add" | "edit" };
type MomentModalState =
    | { mode: "create"; file: File; preview: string }
    | { mode: "edit"; momentId: number }
    | null;

export default function TimelineView() {
    const { uid, coupleId, userDoc, logout } = useAuth();
    const { loading, error, couple, moments, blocks, partnerUid } = useTimeline(coupleId, uid);

    const [busy, setBusy] = useState(false);
    const [viewingReview, setViewingReview] = useState<ReviewTarget | null>(null);
    const [editingReview, setEditingReview] = useState<ReviewFormTarget | null>(null);
    const [momentModal, setMomentModal] = useState<MomentModalState>(null);

    /**
     * Registro de instancias de Swiper, una por bloque.
     * Es un ref y no estado: guardarlas en estado dispararía un re-render por
     * cada Swiper que se monta, y estas instancias no se pintan, se invocan.
     */
    const swipersRef = useRef<Map<number, SwiperClass>>(new Map());

    /** El <input type="file"> vive oculto; se dispara con .click(). */
    const fileInputRef = useRef<HTMLInputElement>(null);

    const registerSwiper = useCallback((blockId: number, swiper: SwiperClass) => {
        swipersRef.current.set(blockId, swiper);

        // Swiper avisa al destruirse; si no lo quitamos, el Map guarda
        // instancias muertas tras recargar la timeline.
        swiper.on("destroy", () => swipersRef.current.delete(blockId));
    }, []);

    /** "Donde empezó todo": baja al bloque 1 y lo deja en su primer slide. */
    const goToStart = useCallback(() => {
        document.getElementById("container1")?.scrollIntoView({ behavior: "smooth" });
        swipersRef.current.get(1)?.slideTo(0, SLIDE_SPEED);
    }, []);

    const findMoment = (momentId: number | undefined) =>
        moments.find((m) => m.momentId === momentId) ?? null;

    function handleViewReview(moment: IndexedMoment, reviewerUid: string) {
        setViewingReview({ momentId: moment.momentId, reviewerUid });
    }

    function handleAddReview(moment: IndexedMoment) {
        setEditingReview({ momentId: moment.momentId, mode: "add" });
    }

    /** Desde el modal de lectura: pasar a editar mi propia reseña. */
    function handleEditOwnReview() {
        if (!viewingReview) return;

        setEditingReview({ momentId: viewingReview.momentId, mode: "edit" });
        setViewingReview(null);
    }

    async function handleSaveReview(draft: ReviewDraft) {
        if (!editingReview || !coupleId || !uid) return;

        const { momentId, mode } = editingReview;
        setEditingReview(null);
        setBusy(true);

        try {
            // El listener de Firestore repinta el slide solo, sin esperar al servidor.
            await saveReview(
                coupleId,
                momentId,
                uid,
                userDoc?.displayName ?? "User",
                draft,
                mode === "add"
            );
        } catch (e) {
            console.error("Error guardando la reseña:", e);
        } finally {
            setBusy(false);
        }
    }

    function handleNewMoment() {
        fileInputRef.current?.click();
    }

    function handleImagePicked(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        // Permite volver a elegir el mismo archivo dos veces seguidas.
        event.target.value = "";
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setMomentModal({ mode: "create", file, preview: String(e.target?.result ?? "") });
        };
        reader.readAsDataURL(file);
    }

    function handleEditMoment(moment: IndexedMoment) {
        setMomentModal({ mode: "edit", momentId: moment.momentId });
    }

    async function handleSaveMoment(draft: MomentDraft) {
        if (!coupleId || !uid || !momentModal) return;

        const state = momentModal;
        setMomentModal(null);
        setBusy(true);

        try {
            if (state.mode === "create") {
                await createMoment(
                    coupleId,
                    uid,
                    userDoc?.displayName ?? "User",
                    {
                        title: draft.title,
                        place: draft.place,
                        intimacyCount: draft.intimacyCount,
                        song: draft.song,
                        description: draft.description,
                        rating: draft.rating,
                        feeling: draft.feeling,
                        timestamp: draft.timestamp
                    },
                    state.file
                );
            } else {
                await editMoment(coupleId, state.momentId, {
                    title: draft.title,
                    place: draft.place,
                    intimacyCount: draft.intimacyCount,
                    song: draft.song,
                    timestamp: draft.timestamp
                });
            }
        } catch (e) {
            console.error("Error guardando el momento:", e);
        } finally {
            setBusy(false);
        }
    }

    if (loading) return <Loader show />;

    if (error) {
        return (
            <main className="min-h-screen grid place-items-center bg-pink-700 text-white p-6">
                <p>{error}</p>
            </main>
        );
    }

    const myUid = uid ?? "";
    const displayNames = couple?.displayNames ?? {};

    const viewedMoment = findMoment(viewingReview?.momentId);
    const reviewedMoment = findMoment(editingReview?.momentId);
    const editedMoment = momentModal?.mode === "edit" ? findMoment(momentModal.momentId) : null;

    return (
        <>
            <Loader show={busy} />

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImagePicked}
            />

            <Hero
                title={couple?.title}
                // Orden estable: el de members, no el del objeto displayNames.
                names={couple?.members?.map((memberUid) => displayNames[memberUid]).filter(Boolean)}
                onNewMoment={handleNewMoment}
                onLogout={logout}
                onGoToStart={goToStart}
            />

            <Timeline
                blocks={blocks}
                myUid={myUid}
                partnerUid={partnerUid ?? ""}
                displayNames={displayNames}
                onViewReview={handleViewReview}
                onAddReview={handleAddReview}
                onEditMoment={handleEditMoment}
                onSwiperReady={registerSwiper}
            />

            <ReviewModal
                moment={viewedMoment}
                reviewerUid={viewingReview?.reviewerUid ?? null}
                myUid={myUid}
                displayNames={displayNames}
                onClose={() => setViewingReview(null)}
                onEdit={handleEditOwnReview}
            />

            <ReviewFormModal
                moment={reviewedMoment}
                mode={editingReview?.mode ?? "add"}
                genre={userDoc?.genre ?? null}
                existing={
                    editingReview?.mode === "edit"
                        ? reviewedMoment?.participants?.[myUid] ?? null
                        : null
                }
                onClose={() => setEditingReview(null)}
                onSave={handleSaveReview}
            />

            <MomentModal
                mode={momentModal?.mode ?? "create"}
                open={momentModal != null}
                moment={editedMoment}
                imagePreview={momentModal?.mode === "create" ? momentModal.preview : null}
                genre={userDoc?.genre ?? null}
                onClose={() => setMomentModal(null)}
                onChangeImage={handleNewMoment}
                onSave={handleSaveMoment}
            />
        </>
    );
}
