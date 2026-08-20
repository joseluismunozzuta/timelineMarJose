/** @type {import('next').NextConfig} */
const nextConfig = {
    // Exportación estática: genera HTML/CSS/JS plano en ./out
    // Netlify publica esa carpeta igual que hoy publica src/.
    output: "export",

    // next/image no puede optimizar sin servidor. Las fotos de momentos
    // ya se comprimen en el navegador antes de subirse a Storage.
    images: {
        unoptimized: true
    }
};

export default nextConfig;
