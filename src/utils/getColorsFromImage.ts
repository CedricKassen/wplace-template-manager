import { Color, ColorValue } from "./types";
import { FreeColor, InvertedFreeColorMap, InvertedPaidColorMap, PaidColor } from "../colorMap";
import { rgbToHex } from "./rgbToHex";
import { CustomCanvas } from "./CustomCanvas";

export const getColorsFromImage = async (image: ImageBitmap) => {
    const renderingCanvas = new CustomCanvas(image.width, image.height);
    renderingCanvas.ctx.drawImage(image, 0, 0);

    const imageData = renderingCanvas.ctx.getImageData(
        0,
        0,
        renderingCanvas.canvas.width,
        renderingCanvas.canvas.height,
    );
    const colors: Set<ColorValue> = new Set();

    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];

        if (r !== undefined && g !== undefined && b !== undefined) {
            const hex = rgbToHex(r, g, b);
            colors.add(hex as ColorValue);
        }
    }

    const mappedColors = Array.from(colors.values()).map((hex) => {
        let color: Color | undefined = InvertedFreeColorMap.get(hex as FreeColor);
        if (!color) {
            color = InvertedPaidColorMap.get(hex as PaidColor);
        }

        return color;
    });

    renderingCanvas.destroy();

    return mappedColors.filter((color) => !!color);
};
