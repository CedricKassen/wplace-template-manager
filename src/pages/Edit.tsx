import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { Overlay } from "../components/Overlay/Overlay";
import { useParam } from "../components/Router/useParam";
import { useAtom } from "jotai";
import { overlayAtom } from "../atoms/overlay";
import { base64ToImage } from "../utils/base64ToImage";
import { useNavigate } from "../components/Router/navigate";
import text from "png-chunk-text";
import encode from "png-chunks-encode";
import extract from "png-chunks-extract";
import { Buffer } from "buffer";
import { ColorPicker } from "../components/ColorPicker/ColorPicker";
import { Color } from "../colorMap";
import { CoordinateForm } from "../components/FormInputs/CoordinateForm";
import { ImageUpload } from "../components/FormInputs/ImageUpload";

export const Edit: FC = () => {
    const [error, setError] = useState<string>();
    // Inputs
    const [startChunk, setStartChunk] = useState<number[]>([]);
    const [startPosition, setStartPosition] = useState<number[]>([]);
    const [selectedColors, setSelectedColors] = useState<Color[]>([]);

    const [image, setImage] = useState<string>();
    const [imageColors, setImageColors] = useState<Color[]>();
    const [height, setHeight] = useState<number>(0);
    const [width, setWidth] = useState<number>(0);

    const [changeName, setChangeName] = useState<string>();

    const [overlays, setOverlay] = useAtom(overlayAtom);
    const [onlyShowSelectedColors, setOnlyShowSelectedColors] = useState<boolean>(false);
    const name = useParam("name");
    const navigate = useNavigate();

    const currentOverlayIndex = useMemo(() => {
        return overlays.findIndex((overlay) => overlay.name === name);
    }, [overlays, name]);

    useEffect(() => {
        setOnlyShowSelectedColors(overlays[currentOverlayIndex]?.onlyShowSelectedColors ?? false);
        setSelectedColors(overlays[currentOverlayIndex]?.colorSelection ?? []);
    }, [overlays, currentOverlayIndex]);

    useEffect(() => {
        if (overlays[currentOverlayIndex]) {
            setStartChunk(overlays[currentOverlayIndex].chunk);
            setStartPosition(overlays[currentOverlayIndex].coordinate);
        }
    }, []);

    useEffect(() => {
        const overlay = overlays.find((overlay) => overlay.name === changeName);

        if (overlay?.name) {
            setError(`An overlay with the name ${overlay.name} already exists`);
        } else {
            setError(undefined);
        }
    }, [changeName]);

    const exportButton = (
        <button
            className={"btn btn-sm"}
            onClick={async () => {
                const overlay = overlays[currentOverlayIndex];
                const image = base64ToImage(overlay.image, "image/png");
                const imageBuffer = Buffer.from(await image.arrayBuffer());
                const chunks = extract(imageBuffer);

                chunks.splice(
                    chunks.length - 1,
                    0,
                    text.encode(
                        "wplace",
                        `${overlay.name},${overlay.chunk[0]},${overlay.chunk[1]},${overlay.coordinate[0]},${overlay.coordinate[1]}`,
                    ),
                );

                const newBlob = new Blob([new Uint8Array(encode(chunks))], {
                    type: "image/png",
                });

                const url = URL.createObjectURL(newBlob);
                const a = document.createElement("a");
                a.href = url;
                a.download = overlay.name + ".png";
                a.click();
                URL.revokeObjectURL(url);
            }}
        >
            Export
        </button>
    );

    const deleteButton = (
        <button
            className={"btn btn-sm"}
            onClick={() => {
                setOverlay([
                    ...overlays.slice(0, currentOverlayIndex),
                    ...overlays.slice(currentOverlayIndex + 1),
                ]);
                navigate("/");
            }}
        >
            Delete
        </button>
    );

    return (
        <Overlay
            headline={"Edit " + name}
            showBack
            customRenderer={
                <div>
                    {exportButton}
                    {deleteButton}
                </div>
            }
        >
            {error && <div className={"error btn btn-md btn-error"}>{error}</div>}
            <table className={"table max-sm:text-sm"}>
                <tbody>
                    <tr>
                        <td
                            className={"column"}
                            style={{ alignItems: "flex-start", width: "100%" }}
                        >
                            <h2> Change Name </h2>
                            <label className={"input w-full desktop-auto"}>
                                <span className="label">Name</span>
                                <input
                                    onChange={(event) => setChangeName(event.target.value)}
                                    placeholder={overlays[currentOverlayIndex]?.name ?? "Name"}
                                    className={"h-full"}
                                    onKeyDown={(event) => {
                                        event.stopPropagation();
                                    }}
                                />
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <td className={"column"} style={{ alignItems: "flex-start" }}>
                            <h2> Change Coordinates </h2>
                            <CoordinateForm
                                chunkValue={startChunk}
                                coordinateValue={startPosition}
                                setChunkValue={setStartChunk}
                                setCoordinateValue={setStartPosition}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td className={"column"} style={{ alignItems: "flex-start" }}>
                            <h2> Set Visible Colors </h2>
                            <label>
                                <input
                                    type={"checkbox"}
                                    checked={onlyShowSelectedColors}
                                    onChange={(event) => {
                                        setOnlyShowSelectedColors(event.target.checked);
                                    }}
                                    style={{ marginRight: "10px" }}
                                />
                                Only show selected Colors
                            </label>
                            <ColorPicker
                                colorList={overlays[currentOverlayIndex]?.templateColors}
                                setSelectedColorState={setSelectedColors}
                                selectedColorState={selectedColors}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td className={"column"} style={{ alignItems: "flex-start" }}>
                            <h2> Change Template Image </h2>
                            <ImageUpload
                                setImage={setImage}
                                setImageColors={setImageColors}
                                setHeight={setHeight}
                                setWidth={setWidth}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <button
                className={"btn btn-primary"}
                disabled={!!error}
                onClick={() => {
                    setOverlay([
                        ...overlays.slice(0, currentOverlayIndex),
                        {
                            ...overlays[currentOverlayIndex],
                            colorSelection: selectedColors,
                            chunk: startChunk as [number, number],
                            coordinate: startPosition as [number, number],
                            onlyShowSelectedColors,

                            ...(() =>
                                image
                                    ? {
                                          image,
                                          height,
                                          width,
                                          templateColors: imageColors!,
                                      }
                                    : {})(),

                            ...(() =>
                                changeName
                                    ? {
                                          name: changeName,
                                      }
                                    : {})(),
                        },
                        ...overlays.slice(currentOverlayIndex + 1),
                    ]);
                    navigate("/");
                }}
            >
                Save
            </button>
        </Overlay>
    );
};
