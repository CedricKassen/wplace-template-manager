import React, { FC, useEffect, useRef } from "react";
import { useNavigate } from "../Router/navigate";
import { JumpEventData } from "../../fetch";
import { awaitElement } from "../../utils/awaitElement";
import { Location } from "../Icons/Location";
import { Cog } from "../Icons/Cog";
export const OverlayListEntry: FC<{
    image: string;
    name: string;
    chunk: [number, number];
    position: [number, number];
}> = ({ name, image, chunk, position }) => {
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
                <button onClick={() => navigate("/edit/" + name)}>
                    <Cog className={"icon"} />
                </button>
                <button
                    onClick={() => {
                        window.postMessage({
                            source: "overlay-location-service",
                            chunk,
                            position,
                        } as JumpEventData);
                        awaitElement("button[title='Explore']").then((button) => {
                            button.dispatchEvent(
                                new Event("click", { bubbles: true, cancelable: true }),
                            );
                        });
                    }}
                >
                    <Location className={"icon"} />
                </button>
            </td>
        </tr>
    );
};
