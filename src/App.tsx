import React, { useEffect, useState } from "react";
import { RouteProvider } from "./components/Router/RouteContext";
import { Outlet } from "./components/Router/Outlet";
import { Overview } from "./pages/Overview";
import { Create } from "./pages/Create";
import { Import } from "./pages/Import";
import { Edit } from "./pages/Edit";
import { renderSquares } from "./utils/renderSquares";
import { useSetAtom, useAtomValue, useAtom } from "jotai";
import { overlayAtom } from "./atoms/overlay";
import { positionAtom } from "./atoms/position";
import { showOverlayAtom } from "./atoms/showOverlay";
import { createPortal } from "react-dom";
import { awaitElement } from "./utils/awaitElement";

import "./App.css";
import { IconContext, PaintBrushHouseholdIcon, PaintBrushIcon } from "@phosphor-icons/react";

const routes = new Map([
    ["/", <Overview />],
    ["/create", <Create />],
    ["/import", <Import />],
    ["/edit/{name}", <Edit />],
]);

function App() {
    const [showOverlay, setShowOverlay] = useAtom(showOverlayAtom);
    const setPosition = useSetAtom(positionAtom);
    const [buttonPortal, setButtonPortal] = useState<HTMLDivElement | null>(null);
    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
    const overlays = useAtomValue(overlayAtom);

    const sharedData = {
        overlays,
        jumpTo: {
            chunk: null,
            position: null,
        },
        pixelUrlRegex: new RegExp(
            "^https://backend\\.wplace\\.live/s\\d+/pixel/(\\d+)/(\\d+)\\?x=(\\d+)&y=(\\d+)$",
        ),
        filesUrlRegex: new RegExp(
            "^https://backend\\.wplace\\.live/files/s\\d+/tiles/(\\d+)/(\\d+)\\.png$",
        ),
        randomTileUrlRegex: new RegExp(
            "^https://backend\\.wplace\\.live/s\\d+/tile/random$",
        )
    };

    useEffect(() => {
        const originals = {
            blob: Response.prototype.blob,
            json: Response.prototype.json,
            arrayBuffer: Response.prototype.arrayBuffer,
        } as const;

        const handleMessage = (event: MessageEvent) => {
            const { source, chunk, position } = event.data;

            if (source === "overlay-location-service") {
                sharedData.jumpTo.position = position;
                sharedData.jumpTo.chunk = chunk;
            }
        };

        window.addEventListener("message", handleMessage);

        Response.prototype.blob = async function (this: Response): Promise<Blob> {
            if (!this.url || this.url.length === 0) {
                return originals.blob.call(this);
            }
            if (sharedData.filesUrlRegex.test(this.url)) {
                const m = sharedData.filesUrlRegex.exec(this.url);
                if (m) {
                    const [, chunkX, chunkY] = m;
                    const origBlob = await originals.blob.call(this);
                    const overlayBlob = await renderSquares(
                        origBlob,
                        sharedData.overlays,
                        parseInt(chunkX, 10),
                        parseInt(chunkY, 10),
                    );
                    return overlayBlob || origBlob;
                }
            }
            return originals.blob.call(this);
        };
        Response.prototype.arrayBuffer = async function (this: Response): Promise<ArrayBuffer> {
            const blob = await this.blob();
            return blob.arrayBuffer();
        };
        Response.prototype.json = async function (this: Response): Promise<any> {
            if (!this.url || this.url.length === 0) {
                return originals.json.call(this);
            }
            if (sharedData.randomTileUrlRegex.test(this.url)) {
                if (sharedData.jumpTo.chunk && sharedData.jumpTo.position) {
                    const jumpResponse = {
                        pixel: {
                            x: sharedData.jumpTo.position[0],
                            y: sharedData.jumpTo.position[1]
                        },
                        tile: {
                            x: sharedData.jumpTo.chunk[0],
                            y: sharedData.jumpTo.chunk[1]
                        }
                    };
                    sharedData.jumpTo.chunk = null;
                    sharedData.jumpTo.position = null;
                    return jumpResponse;
                }
            } else if (sharedData.pixelUrlRegex.test(this.url)) {
                const m = sharedData.pixelUrlRegex.exec(this.url);
                if (m) {
                    const [, chunkX, chunkY, positionX, positionY] = m;
                    const chunk = [parseInt(chunkX, 10), parseInt(chunkY, 10)];
                    const position = [parseInt(positionX, 10), parseInt(positionY, 10)];
                    setPosition({ position, chunk });
                }
            }

            return originals.json.call(this);
        };

        return () => {
            window.removeEventListener("message", handleMessage);
            Response.prototype.blob = originals.blob;
            Response.prototype.json = originals.json;
            Response.prototype.arrayBuffer = originals.arrayBuffer;
        };
    }, [sharedData]);

    useEffect(() => {
        const mutationObserver = new MutationObserver(() => {
            awaitElement(
                "div.absolute.right-2.top-2.z-30 > div.flex.flex-col.gap-4.items-center > div.flex.flex-col.items-center.gap-3",
            ).then((element) => {
                setButtonPortal(element as HTMLDivElement);
            });
        });

        mutationObserver.observe(document.body, { childList: true, subtree: true });
        return () => mutationObserver.disconnect();
    }, []);

    return (
        <RouteProvider routes={routes}>
            <IconContext.Provider
                value={{
                    size: 20,
                    mirrored: false,
                    weight: "bold",
                }}
            >
                <div className="App">
                    {createPortal(
                        <div
                            className={"btn btn-md shadow-md btn-circle"}
                            onClick={() => setShowOverlay(!showOverlay)}
                        >
                            <PaintBrushHouseholdIcon />
                        </div>,
                        buttonPortal ?? document.body,
                    )}
                    {showOverlay && <Outlet />}
                </div>
            </IconContext.Provider>
        </RouteProvider>
    );
}

export default App;
