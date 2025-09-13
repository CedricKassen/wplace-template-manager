import React, { FC, useEffect, useRef } from "react";
import { useNavigate } from "../Router/navigate";
import { awaitElement } from "../../utils/awaitElement";
import { sleep } from "../../utils/sleep";
import { EyeClosedIcon, EyeIcon, GearIcon, MapPinIcon } from "@phosphor-icons/react";

export const OverlayListEntry: FC<{
    image: string;
    name: string;
    chunk: [number, number];
    position: [number, number];
    isHidden: boolean;
    toggleVisiblity: () => void;
    height: number;
    width: number;
}> = ({ name, image, chunk, position, isHidden, toggleVisiblity, width, height }) => {
    const navigate = useNavigate();
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!imgRef.current) return;
        imgRef.current!.src = "data:image/bmp;base64," + image;
    }, [image]);

    return (
        <tr>
            <td className={"groupRow"}>
                <img ref={imgRef} alt={"logo"} style={{ width: "2.5rem" }} />
                <span> {name} </span>
            </td>
            <td
                className={"groupRow coordinates"}
                style={{ flexGrow: 1, justifyContent: "flex-end" }}
            >
                <span className={"btn btn-sm coordinate-display"}> {chunk[0]} </span>
                <span className={"btn btn-sm coordinate-display"}> {chunk[1]} </span>
                <span className={"btn btn-sm coordinate-display"}> {position[0]} </span>
                <span className={"btn btn-sm coordinate-display"}> {position[1]} </span>
            </td>
            <td className={"groupRow"} style={{ gap: "2rem" }}>
                <button onClick={toggleVisiblity}>
                    {isHidden ? <EyeClosedIcon /> : <EyeIcon />}
                </button>
                <button onClick={() => navigate("/edit/" + name)}>
                    <GearIcon />
                </button>
                <button
                    onClick={async () => {
                        window.postMessage({
                            source: "overlay-location-service",
                            chunk,
                            position: [position[0] + width / 2, position[1] + height / 2],
                        });
                        await sleep(200);
                        awaitElement("button[title='Explore']").then((button) => {
                            button.dispatchEvent(
                                new Event("click", { bubbles: true, cancelable: true }),
                            );
                        });
                    }}
                >
                    <MapPinIcon />
                </button>
            </td>
        </tr>
    );
};
