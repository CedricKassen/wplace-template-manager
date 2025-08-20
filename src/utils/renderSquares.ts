import { Overlay, overlayAtom } from "../atoms/overlay";
import { base64ToImage } from "./base64ToImage";
import { Color, ColorValue, FreeColor, FreeColorMap, PaidColor, PaidColorMap } from "../colorMap";
import { log } from "./log";
import { rgbToHex } from "./rgbToHex";

export async function renderSquares(
    baseBlob: Blob,
    overlays: Overlay[],
    chunkX: number,
    chunkY: number,
): Promise<Blob | null> {
    const expandedOverlays = await Promise.all(
        overlays.map(async (overlay) => {
            const image = base64ToImage(overlay.image, "image/png");
            const bitmap = await createImageBitmap(image);

            return {
                ...overlay,
                height: bitmap.height,
                width: bitmap.width,
                bitmap: bitmap,
                toChunkX:
                    overlay.chunk[0] + Math.floor((overlay.coordinate[0] + bitmap.width) / 1000),
                toChunkY:
                    overlay.chunk[1] + Math.floor((overlay.coordinate[1] + bitmap.height) / 1000),
            };
        }),
    );
    const chunkOverlays = expandedOverlays.filter((overlay) => {
        const greaterThanMin = chunkX >= overlay.chunk[0] && chunkY >= overlay.chunk[1];
        const smallerThanMax = chunkX <= overlay.toChunkX && chunkY <= overlay.toChunkY;

        return greaterThanMin && smallerThanMax;
    });

    const canvas = document.createElement("canvas");

    canvas.width = 3000;
    canvas.height = 3000;

    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    const img = await createImageBitmap(baseBlob);
    ctx.drawImage(img, 0, 0, 3000, 3000);

    const renderedOverlays = []

    for (const overlay of chunkOverlays) {
        const chunkXIndex = overlay.toChunkX - overlay.chunk[0] - (overlay.toChunkX - chunkX);
        const chunkYIndex = overlay.toChunkY - overlay.chunk[1] - (overlay.toChunkY - chunkY);

        const image = base64ToImage(overlay.image, "image/png");
        const bitmap = await createImageBitmap(image, {
            imageOrientation: "from-image",
        });

        let colorFilter: ColorValue[] | undefined;

        if (overlay?.onlyShowSelectedColors) {
            colorFilter = overlay?.colorSelection.map((color) => {
                const freeColor = FreeColorMap.get(color as keyof typeof FreeColor);
                if (freeColor) {
                    return freeColor;
                } else {
                    return PaidColorMap.get(color as keyof typeof PaidColor)!;
                }
            });
        }

        const templateBitmap = await createTemplateBitmap(bitmap, colorFilter);

        ctx.drawImage(
            templateBitmap,
            overlay.coordinate[0] * 3 - chunkXIndex * 3000,
            overlay.coordinate[1] * 3 - chunkYIndex * 3000,
            templateBitmap.width,
            templateBitmap.height,
        );

        renderedOverlays.push(overlay)
    }

    const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!));
    });

    window.postMessage({
        source: "template-renderer-result",
        templates: renderedOverlays,
    })

    canvas.remove();

    return blob;
}

const createTemplateBitmap = async (
    imageBitmap: ImageBitmap,
    colorFilter?: ColorValue[],
): Promise<ImageBitmap> => {
    const canvas = document.createElement("canvas");

    canvas.width = imageBitmap.width * 3;
    canvas.height = imageBitmap.height * 3;

    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const pixelIndex = (y * canvas.width + x) * 4;
            const r = imageData.data[pixelIndex];
            const g = imageData.data[pixelIndex + 1];
            const b = imageData.data[pixelIndex + 2];

            const hex = rgbToHex(r, g, b);

            if (x % 3 !== 1 || y % 3 !== 1) {
                imageData.data[pixelIndex + 3] = 0;
            }
            if (colorFilter && !colorFilter.includes(hex as ColorValue)) {
                imageData.data[pixelIndex + 3] = 0;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const bitmap = createImageBitmap(canvas);
    canvas.remove();

    return bitmap;
};
