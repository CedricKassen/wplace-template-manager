import React, { createRef, FC, useEffect, useRef, useState } from "react";
import { Overlay } from "../components/Overlay/Overlay";
import { useNavigate } from "../components/Router/navigate";
import text from "png-chunk-text";
import extract from "png-chunks-extract";
import { Buffer } from "buffer";
import { getColorsFromImage } from "../utils/getColorsFromImage";
import { imageToBase64 } from "../utils/imageToBase64";
import { useAtom } from "jotai/index";
import { overlayAtom } from "../atoms/overlay";
import { Color } from "../colorMap";

const ImportTableRow: FC<{
    image: string;
    chunk: [number, number];
    position: [number, number];
    name: string;
}> = ({ image, chunk, position, name }) => {
    return (
        <tr>
            <td>
                <img
                    alt={"imported image"}
                    src={"data:image/bmp;base64," + image}
                    style={{ width: "2.5rem" }}
                />
            </td>
            <td> {name} </td>
            <td
                className={"groupRow coordinates"}
                style={{ flexGrow: 1, justifyContent: "flex-end" }}
            >
                <span className={"btn btn-sm coordinate-display"}> {chunk[0]} </span>
                <span className={"btn btn-sm coordinate-display"}> {chunk[1]} </span>
                <span className={"btn btn-sm coordinate-display"}> {position[0]} </span>
                <span className={"btn btn-sm coordinate-display"}> {position[1]} </span>
            </td>
        </tr>
    );
};

export const Import: FC = () => {
    const navigate = useNavigate();
    const fileInput = useRef<HTMLInputElement>(null);
    const [overlays, setOverlays] = useAtom(overlayAtom);
    const [notImportedWarning, setNotImportedWarning] = useState<string[]>([]);

    const [fileList, setFileList] = useState<File[]>();
    const [convertedTemplates, setConvertedTemplates] = useState<
        {
            name: string;
            chunk: [number, number];
            position: [number, number];
            height: number;
            width: number;
            image: string;
            imageColors: Color[];
        }[]
    >([]);

    useEffect(() => {
        if (!fileList?.length) return;

        setNotImportedWarning([]);
        setConvertedTemplates([]);

        for (const file of fileList!) {
            file.arrayBuffer().then(async (imageArrayBuffer) => {
                const imageBuffer = Buffer.from(imageArrayBuffer);
                const chunks = extract(imageBuffer);

                const textChunks = chunks
                    .filter(function (chunk) {
                        return chunk.name === "tEXt";
                    })
                    .map(function (chunk) {
                        return text.decode(chunk.data);
                    });

                const dataChunk = textChunks.find(({ keyword }) => keyword === "wplace");
                const importedData = dataChunk?.text.split(",");

                if (!importedData) {
                    setNotImportedWarning((prev) => [...prev, `${file.name}: No metadata found!`]);
                    return;
                }

                const overlay = overlays.find((overlay) => overlay.name === importedData[0]);

                if (overlay?.name) {
                    setNotImportedWarning((prev) => [
                        ...prev,
                        `${file.name}: Overlay with name ${importedData[0]} already exists!`,
                    ]);
                    return;
                }

                const bitmap = await createImageBitmap(file);
                const image = await imageToBase64(file);
                const imageColors = await getColorsFromImage(bitmap);

                setConvertedTemplates((prev) => [
                    ...prev,
                    {
                        name: importedData[0],
                        chunk: [Number(importedData[1]), Number(importedData[2])],
                        position: [Number(importedData[3]), Number(importedData[4])],
                        height: bitmap.height,
                        width: bitmap.width,
                        image,
                        imageColors,
                    },
                ]);
            });
        }
    }, [fileList]);

    const pasteHandler = (event: any) => {
        if (!fileInput.current) return;
        fileInput.current.files = event.clipboardData?.files ?? new FileList();
        fileInput.current.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    };

    useEffect(() => {
        window.addEventListener("paste", pasteHandler);
        return () => window.removeEventListener("paste", pasteHandler);
    }, []);

    return (
        <Overlay headline={"Import Template"} showBack>
            <label className={"FileInput input w-full"}>
                <span className={"label"}>Template Image</span>
                <input
                    name={"template"}
                    placeholder={"Template"}
                    accept={"image/png"}
                    type={"file"}
                    ref={fileInput}
                    multiple={true}
                    onChange={(e) => {
                        setFileList(Array.from(e.target.files as ArrayLike<File>));
                    }}
                />
            </label>

            {!!notImportedWarning.length && (
                <div
                    className={"warning btn btn-md btn-warning column p-4"}
                    style={{ alignItems: "flex-start" }}
                >
                    <b>
                        {notImportedWarning.length}{" "}
                        {notImportedWarning.length === 1 ? "Template" : "Templates"} could not be
                        imported for the following reasons:
                    </b>
                    <ul>
                        {notImportedWarning.map((reason) => (
                            <li>{reason}</li>
                        ))}
                    </ul>
                </div>
            )}

            <table className={"table max-sm:text-sm"}>
                <tbody>
                    {convertedTemplates.map((template) => {
                        return <ImportTableRow {...template} />;
                    })}
                </tbody>
            </table>

            <button
                className={"btn btn-primary"}
                disabled={!convertedTemplates?.length}
                onClick={async () => {
                    setOverlays([
                        ...overlays,
                        ...convertedTemplates.map((template) => ({
                            name: template.name,
                            width: template.width,
                            height: template.height,
                            chunk: template.chunk,
                            coordinate: template.position,
                            image: template.image,
                            colorSelection: [],
                            onlyShowSelectedColors: false,
                            templateColors: template.imageColors,
                        })),
                    ]);
                    navigate("/");
                }}
            >
                Import
            </button>
        </Overlay>
    );
};
