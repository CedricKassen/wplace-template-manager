import { Point2D, PixelLocation, PixelJumpRequest, PixelJumpResponse } from "../../utils/types";
import React, { FC, useEffect, useRef } from "react";
import { EyeClosedIcon, EyeIcon, GearIcon, MapPinIcon } from "@phosphor-icons/react";
import { useNavigate } from "../Router/navigate";
import { awaitElement } from "../../utils/awaitElement";
import { sleep } from "../../utils/sleep";

export const OverlayListEntry: FC<{
    image: string;
    name: string;
    location: PixelLocation;
    isHidden: boolean;
    toggleVisiblity: () => void;
    height: number;
    width: number;
}> = ({ name, image, location, isHidden, toggleVisiblity, width, height }) => {
    const navigate = useNavigate();
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!imgRef.current) return;
        imgRef.current!.src = "data:image/bmp;base64," + image;
    }, [image]);

    async function sendJumpRequest() {
        return new Promise<void>((resolve) => {
            const request: PixelJumpRequest = {
                id: crypto.randomUUID(),
                location: {
                    tile: location.tile,
                    pixel: {
                        x: location.pixel.x + Math.trunc(width / 2),
                        y: location.pixel.y + Math.trunc(height / 2),
                    },
                },
            };
            const handleResponse = (event: Event) => {
                const customEvent = event as CustomEvent<PixelJumpResponse>;
                const response = customEvent.detail;
                if (response.requestId === request.id) {
                    window.removeEventListener("overlay-jump-response", handleResponse);
                    resolve();
                }
            };
            window.addEventListener("overlay-jump-response", handleResponse);
            window.dispatchEvent(
                new CustomEvent<PixelJumpRequest>("overlay-jump-request", {
                    detail: request,
                }),
            );
        });
    }

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
                <span className={"btn btn-sm coordinate-display"}> {location.tile.x} </span>
                <span className={"btn btn-sm coordinate-display"}> {location.tile.y} </span>
                <span className={"btn btn-sm coordinate-display"}> {location.pixel.x} </span>
                <span className={"btn btn-sm coordinate-display"}> {location.pixel.y} </span>
            </td>
            <td className={"groupRow"} style={{ gap: "2rem" }}>
                <button onClick={toggleVisiblity}>
                    {isHidden ? <EyeClosedIcon /> : <EyeIcon />}
                </button>
                <button onClick={() => navigate("/edit/" + name)}>
                    <GearIcon />
                </button>
                <button
                    onClick={() => {
                        sendJumpRequest().then(() => {
                            awaitElement("button[title='Explore']").then((button) => {
                                button.dispatchEvent(
                                    new Event("click", { bubbles: true, cancelable: true }),
                                );
                            });
                        });
                    }}
                >
                    <MapPinIcon />
                </button>
            </td>
        </tr>
    );
};
