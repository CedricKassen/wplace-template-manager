import { ColorValue } from "./types";
import { hexToRgb } from "./hexToRgb";
import { CustomCanvas } from "./CustomCanvas";

export const optimizeColors = async (
    imageBitmap: ImageBitmap,
    colorList: ColorValue[],
    scale = 1,
): Promise<Blob> => {
    const renderingCanvas = new CustomCanvas(imageBitmap.width * scale, imageBitmap.height * scale);

    renderingCanvas.ctx.drawImage(
        imageBitmap,
        0,
        0,
        renderingCanvas.canvas.width,
        renderingCanvas.canvas.height,
    );
    const imageData = renderingCanvas.ctx.getImageData(
        0,
        0,
        renderingCanvas.canvas.width,
        renderingCanvas.canvas.height,
    );
    const data = imageData.data;

    const rgbColors = colorList.map(hexToRgb);
    const COLOR_SPACE_PRECISION = 16;
    const colorLookup = new Int32Array(
        COLOR_SPACE_PRECISION * COLOR_SPACE_PRECISION * COLOR_SPACE_PRECISION,
    );

    for (let r = 0; r < COLOR_SPACE_PRECISION; r++) {
        for (let g = 0; g < COLOR_SPACE_PRECISION; g++) {
            for (let b = 0; b < COLOR_SPACE_PRECISION; b++) {
                const actualR = ((r * 255) / (COLOR_SPACE_PRECISION - 1)) | 0;
                const actualG = ((g * 255) / (COLOR_SPACE_PRECISION - 1)) | 0;
                const actualB = ((b * 255) / (COLOR_SPACE_PRECISION - 1)) | 0;

                let minDistance = Number.MAX_VALUE;
                let closestColorIndex = 0;

                for (let i = 0; i < rgbColors.length; i++) {
                    const color = rgbColors[i];
                    const distance =
                        2 * (actualR - color.r) * (actualR - color.r) +
                        4 * (actualG - color.g) * (actualG - color.g) +
                        3 * (actualB - color.b) * (actualB - color.b);

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestColorIndex = i;
                    }
                }

                const index =
                    r * COLOR_SPACE_PRECISION * COLOR_SPACE_PRECISION +
                    g * COLOR_SPACE_PRECISION +
                    b;
                colorLookup[index] = closestColorIndex;
            }
        }
    }

    const length = data.length;
    for (let i = 0; i < length; i += 4) {
        const r = ((data[i] * (COLOR_SPACE_PRECISION - 1)) / 255) | 0;
        const g = ((data[i + 1] * (COLOR_SPACE_PRECISION - 1)) / 255) | 0;
        const b = ((data[i + 2] * (COLOR_SPACE_PRECISION - 1)) / 255) | 0;

        const lookupIndex =
            r * COLOR_SPACE_PRECISION * COLOR_SPACE_PRECISION + g * COLOR_SPACE_PRECISION + b;
        const closestColor = rgbColors[colorLookup[lookupIndex]];

        data[i] = closestColor.r;
        data[i + 1] = closestColor.g;
        data[i + 2] = closestColor.b;

        if (data[i + 3] > 127) {
            data[i + 3] = 255;
        } else {
            data[i + 3] = 0;
        }
    }

    renderingCanvas.ctx.putImageData(imageData, 0, 0);

    const blob = await new Promise<Blob>((resolve) => {
        renderingCanvas.canvas.toBlob((blob) => resolve(blob!));
    });

    renderingCanvas.destroy();

    return blob;
};
