import { PixelLocation, TileRenderRequest, TileRenderResponse } from "./utils/types";
import React, { Suspense, useEffect, useState } from "react";
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
import { IconContext, PaintBrushHouseholdIcon } from "@phosphor-icons/react";

import "./App.css";

const routes = new Map([
    ["/", <Overview />],
    ["/create", <Create />],
    ["/import", <Import />],
    ["/edit/{name}", <Edit />],
    ["/edit/", <Edit />],
]);

function OverlayRenderer() {
    const overlays = useAtomValue(overlayAtom);

    useEffect(() => {
        const handleRenderRequest = async (event: Event) => {
            const customEvent = event as CustomEvent<TileRenderRequest>;
            const request = customEvent.detail;

            const blob = await renderSquares(
                overlays,
                request.tilesCache,
                request.baseBlob,
                request.baseBlobEtag,
                request.tile,
            );

            window.dispatchEvent(
                new CustomEvent<TileRenderResponse>("overlay-render-response", {
                    detail: {
                        requestId: request.id,
                        blob,
                    },
                }),
            );
        };

        window.addEventListener("overlay-render-request", handleRenderRequest);
        return () => window.removeEventListener("overlay-render-request", handleRenderRequest);
    }, [overlays]);

    return null;
}

function App() {
    const [showOverlay, setShowOverlay] = useAtom(showOverlayAtom);
    const setPosition = useSetAtom(positionAtom);
    const [buttonPortal, setButtonPortal] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleData = (event: Event) => {
            const customEvent = event as CustomEvent<PixelLocation>;
            const location = customEvent.detail;
            setPosition(location);
        };

        window.addEventListener("overlay-setPosition-data", handleData);
        return () => window.removeEventListener("overlay-setPosition-data", handleData);
    }, []);

    useEffect(() => {
        const mutationObserver = new MutationObserver(() => {
            awaitElement(
                ".absolute.top-2.right-2.z-40 > .flex.flex-col.gap-4.items-center > .flex.flex-col.items-center.gap-3",
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
                    <Suspense fallback={null}>
                        <OverlayRenderer />
                        {showOverlay && <Outlet />}
                    </Suspense>
                </div>
            </IconContext.Provider>
        </RouteProvider>
    );
}

export default App;
