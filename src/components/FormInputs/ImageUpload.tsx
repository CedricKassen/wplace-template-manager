import React, { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from "react";
import { ColorPicker } from "../ColorPicker/ColorPicker";
import { imageToBase64 } from "../../utils/imageToBase64";
import { getColorsFromImage } from "../../utils/getColorsFromImage";
import { optimizeColors } from "../../utils/optimizeColors";
import {
    Color,
    ColorValue,
    FreeColor,
    FreeColorMap,
    PaidColor,
    PaidColorMap,
} from "../../colorMap";

export const ImageUpload: FC<{
    setImage: Dispatch<SetStateAction<string | undefined>>;
    setImageColors: Dispatch<SetStateAction<Color[] | undefined>>;
    setHeight: Dispatch<SetStateAction<number>>;
    setWidth: Dispatch<SetStateAction<number>>;
}> = ({ setImageColors, setImage, setWidth, setHeight }) => {
    const [optimizeImage, setOptimizeImage] = useState<boolean>(false);
    const [selectedColors, setSelectedColors] = useState<Color[]>([]);
    const [scale, setScale] = useState<number>(1);

    const [uploadBlob, setUploadBlob] = useState<File>();
    const [localImage, setLocalImage] = useState<string>();
    const [localHeight, setLocalHeight] = useState<number>(0);
    const [localWidth, setLocalWidth] = useState<number>(0);

    const fileInput = useRef<HTMLInputElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const pasteHandler = (event: any) => {
        if (!fileInput.current) return;
        fileInput.current.files = event.clipboardData?.files ?? new FileList();
        fileInput.current.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    };

    useEffect(() => {
        window.addEventListener("paste", pasteHandler);
        return () => window.removeEventListener("paste", pasteHandler);
    }, []);

    useEffect(() => {
        if (imgRef.current) {
            imgRef.current!.src = "data:image/bmp;base64," + localImage;
        }
    }, [localImage]);

    useEffect(() => {
        void generateImage();
    }, [uploadBlob, selectedColors, optimizeImage, scale]);

    const generateImage = async () => {
        if (!uploadBlob) return;

        const bitmap = await createImageBitmap(uploadBlob);
        setHeight(bitmap.height);
        setWidth(bitmap.width);
        setLocalWidth(bitmap.width);
        setLocalHeight(bitmap.height);

        if (!optimizeImage || !selectedColors?.length) {
            imageToBase64(uploadBlob).then((b64) => {
                setImage(b64);
                setLocalImage(b64);
            });
            getColorsFromImage(bitmap).then(setImageColors);
        } else {
            optimizeColors(
                bitmap,
                selectedColors.map((inputColor) => {
                    let color: FreeColor | PaidColor | undefined = FreeColorMap.get(
                        inputColor as keyof typeof FreeColor,
                    );

                    if (!color) {
                        color = PaidColorMap.get(inputColor as keyof typeof PaidColor);
                    }

                    if (!color) {
                        throw new Error(`Unknown color "${color}"`);
                    }

                    return color as ColorValue;
                }),
                scale,
            ).then(async (convertedImage) => {
                imageToBase64(convertedImage).then((b64) => {
                    setImage(b64);
                    setLocalImage(b64);
                });
                getColorsFromImage(await createImageBitmap(convertedImage)).then(setImageColors);
            });
        }
    };

    return (
        <>
            <label className={"FileInput input w-full desktop-auto"}>
                <span className={"label"}>Template Image</span>
                <input
                    type={"file"}
                    ref={fileInput}
                    accept={"image/png, image/jpeg"}
                    onChange={async (e) => {
                        setUploadBlob(e.target.files![0]);
                    }}
                />
            </label>
            {localImage && (
                <details style={{ width: "100%" }}>
                    <summary>
                        <div className={"row"} style={{ justifyContent: "center", gap: "2rem" }}>
                            <img ref={imgRef} alt={"imported image"} id={"imagePreview"} />
                            <div className={"column"}>
                                <span>
                                    <b>Height:</b> {Math.floor(localHeight * scale)}px
                                </span>
                                <span>
                                    <b>Width:</b> {Math.floor(localWidth * scale)}px
                                </span>
                                <span>
                                    <b>Scale:</b> {scale}x
                                </span>
                            </div>
                        </div>
                    </summary>
                    <label>
                        <input
                            type={"checkbox"}
                            style={{ marginRight: "10px" }}
                            checked={optimizeImage}
                            onChange={(event) => setOptimizeImage(event.target.checked)}
                        />
                        Optimize Image
                    </label>
                    <input
                        type={"range"}
                        min={0.1}
                        max={10}
                        step={0.1}
                        name={"scale"}
                        placeholder={"Scale"}
                        value={scale}
                        onChange={(e) => setScale(Number(e.target.value))}
                        style={{ width: "100%" }}
                    />
                    <div className={"column"} style={{ alignItems: "flex-start" }}>
                        <ColorPicker
                            setSelectedColorState={setSelectedColors}
                            selectedColorState={selectedColors}
                        />
                    </div>
                </details>
            )}
        </>
    );
};
