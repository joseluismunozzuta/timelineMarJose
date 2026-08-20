import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
    title: "Mar & Jose",
    icons: { icon: "/assets/lovetime.ico" }
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="es">
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
