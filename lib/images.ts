type CompressOptions = {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    mimeType?: string;
    maxSizeMB?: number;
};

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("No se pudo convertir canvas a Blob"));
                    return;
                }
                resolve(blob);
            },
            mimeType,
            quality
        );
    });
}

/** Redimensiona y baja calidad hasta que la imagen pese menos de maxSizeMB. */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<Blob> {
    const {
        maxWidth = 1600,
        maxHeight = 1600,
        quality = 0.8,
        mimeType = "image/jpeg",
        maxSizeMB = 1
    } = options;

    const imageBitmap = await createImageBitmap(file);
    let { width, height } = imageBitmap;

    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(imageBitmap, 0, 0, width, height);

    let currentQuality = quality;
    let blob = await canvasToBlob(canvas, mimeType, currentQuality);

    const maxBytes = maxSizeMB * 1024 * 1024;
    while (blob.size > maxBytes && currentQuality > 0.4) {
        currentQuality -= 0.05;
        blob = await canvasToBlob(canvas, mimeType, currentQuality);
    }

    return blob;
}
