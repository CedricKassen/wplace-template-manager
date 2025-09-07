import { Overlay } from "../atoms/overlay";
import { base64ToImage } from "./base64ToImage";
import { ColorValue, FreeColor, FreeColorMap, PaidColor, PaidColorMap } from "../colorMap";
import { rgbToHex } from "./rgbToHex";
import { CustomCanvas } from "./CustomCanvas";

export async function renderSquares(
    baseBlob: Blob,
    overlays: Overlay[],
    chunkX: number,
    chunkY: number,
): Promise<Blob> {
    const CANVAS_SIZE = 1000;
    const RESCALE_FACTOR = 3; // 3x3 pixel size
    const RESCALED_CANVAS_SIZE = CANVAS_SIZE * RESCALE_FACTOR;

    const expandedOverlays = await Promise.all(
        overlays.map(async (overlay) => {
            if (!overlay.bitmap || !overlay.bitmap.width) {
                const image = base64ToImage(overlay.image, "image/png");
                overlay.bitmap = await createImageBitmap(image, {
                    imageOrientation: "from-image",
                });
            }

            return {
                ...overlay,
                height: overlay.bitmap.height,
                width: overlay.bitmap.width,
                toChunkX:
                    overlay.chunk[0] +
                    Math.floor((overlay.coordinate[0] + overlay.bitmap.width) / CANVAS_SIZE),
                toChunkY:
                    overlay.chunk[1] +
                    Math.floor((overlay.coordinate[1] + overlay.bitmap.height) / CANVAS_SIZE),
            };
        }),
    );
    const chunkOverlays = expandedOverlays.filter((overlay) => {
        if (overlay.hidden) return false;
        const greaterThanMin = chunkX >= overlay.chunk[0] && chunkY >= overlay.chunk[1];
        const smallerThanMax = chunkX <= overlay.toChunkX && chunkY <= overlay.toChunkY;
        return greaterThanMin && smallerThanMax;
    });

    if (chunkOverlays.length === 0)
        return baseBlob;

    const renderingCanvas = new CustomCanvas(RESCALED_CANVAS_SIZE);

    const img = await createImageBitmap(baseBlob);
    renderingCanvas.ctx.drawImage(img, 0, 0, RESCALED_CANVAS_SIZE, RESCALED_CANVAS_SIZE);

    for (const overlay of chunkOverlays) {
        const chunkXIndex = overlay.toChunkX - overlay.chunk[0] - (overlay.toChunkX - chunkX);
        const chunkYIndex = overlay.toChunkY - overlay.chunk[1] - (overlay.toChunkY - chunkY);

        let colorFilter: ColorValue[] | undefined;

        if (overlay.onlyShowSelectedColors) {
            colorFilter = overlay.colorSelection.map((color) => {
                const freeColor = FreeColorMap.get(color as keyof typeof FreeColor);
                if (freeColor) {
                    return freeColor;
                } else {
                    return PaidColorMap.get(color as keyof typeof PaidColor)!;
                }
            });
        }

        const templateBitmap = await createTemplateBitmap(overlay.bitmap!, RESCALE_FACTOR, colorFilter);

        renderingCanvas.ctx.drawImage(
            templateBitmap,
            overlay.coordinate[0] * RESCALE_FACTOR - chunkXIndex * RESCALED_CANVAS_SIZE,
            overlay.coordinate[1] * RESCALE_FACTOR - chunkYIndex * RESCALED_CANVAS_SIZE,
            templateBitmap.width,
            templateBitmap.height,
        );
    }

    const blob = await new Promise<Blob>((resolve) => {
        renderingCanvas.canvas.toBlob((b) => resolve(b || baseBlob), "image/png");
    });

    renderingCanvas.destroy();

    return blob;
}

const createTemplateBitmap = async (
    imageBitmap: ImageBitmap,
    pixelSize: number,
    colorFilter?: ColorValue[],
): Promise<ImageBitmap> => {
    const COLOR_CHANNELS = 4;

    if (colorFilter) {
        const filteringCanvas = new CustomCanvas(imageBitmap.width, imageBitmap.height);

        filteringCanvas.ctx.drawImage(imageBitmap, 0, 0);

        const imageData = filteringCanvas.ctx.getImageData(
            0,
            0,
            imageBitmap.width,
            imageBitmap.height,
        );
        filteringCanvas.destroy();

        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
                const pixelIndex = (y * imageData.width + x) * COLOR_CHANNELS;
                const r = imageData.data[pixelIndex];
                const g = imageData.data[pixelIndex + 1];
                const b = imageData.data[pixelIndex + 2];

                const hex = rgbToHex(r, g, b);
                if (!colorFilter.includes(hex as ColorValue)) {
                    imageData.data[pixelIndex + 3] = 0;
                }
            }
        }

        imageBitmap = await createImageBitmap(imageData);
    }

    const renderingCanvas = new CustomCanvas(
        imageBitmap.width * pixelSize,
        imageBitmap.height * pixelSize,
    );

    const canvas = renderingCanvas.canvas;
    const ctx = renderingCanvas.ctx;

    const mask = new Uint8ClampedArray(pixelSize * pixelSize * COLOR_CHANNELS);
    for (let channel = 0; channel < COLOR_CHANNELS; channel++) mask[4 * 4 + channel] = 255;

    const mask_image = new ImageData(mask, pixelSize);
    const mask_uploaded = await createImageBitmap(mask_image);
    ctx.fillStyle = ctx.createPattern(mask_uploaded, "repeat")!;

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = "source-in";
    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

    const bitmap = createImageBitmap(canvas);
    renderingCanvas.destroy();

    return bitmap;
};
