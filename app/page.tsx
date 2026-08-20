"use client";

import { useAuth } from "@/components/AuthProvider";
import AuthView from "@/components/auth/AuthView";
import CoupleSetupView from "@/components/auth/CoupleSetupView";
import Loader from "@/components/Loader";
import TimelineView from "@/components/TimelineView";

export default function Home() {
    const { stage, error } = useAuth();

    if (stage === "loading") return <Loader show />;
    if (stage === "auth") return <AuthView initialError={error} />;
    if (stage === "setup") return <CoupleSetupView />;

    return <TimelineView />;
}
