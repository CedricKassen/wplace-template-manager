import React, { useEffect, useState } from "react";
import { RouteProvider } from "./components/Router/RouteContext";
import { Outlet } from "./components/Router/Outlet";
import { Overview } from "./pages/Overview";
import { Create } from "./pages/Create";
import { Import } from "./pages/Import";
import { Edit } from "./pages/Edit";
import { BlobEventData } from "./fetch";
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
    ["/edit/", <Edit />],
]);

function App() {
    const [showOverlay, setShowOverlay] = useAtom(showOverlayAtom);
    const setPosition = useSetAtom(positionAtom);
    const [buttonPortal, setButtonPortal] = useState<HTMLDivElement | null>(null);
    const overlays = useAtomValue(overlayAtom);

    const handleMessage = async (event: MessageEvent) => {
        const { source, blob, requestId, chunk, position } = event.data;

        if (source === "wplace-tile-request") {
            window.postMessage({
                requestId,
                source: "overlay-renderer",
                blob: await renderSquares(blob, overlays, chunk[0], chunk[1]),
                chunk,
            } as BlobEventData);
        }

        if (source === "wplace-position-request") {
            setPosition({ position, chunk });
        }
    };

    useEffect(() => {
        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, [overlays]);

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
