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
import { currentTemplates } from "./atoms/currentTemplates";
import { showOverlayAtom } from "./atoms/showOverlay";
import { createPortal } from "react-dom";
import { awaitElement } from "./utils/awaitElement";

import "./App.css";

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
    const overlays = useAtomValue(overlayAtom);
    const setCurrentTemplates = useSetAtom(currentTemplates);

    const handleMessage = async (event: MessageEvent) => {
        const { source, blob, requestId, chunk, position, templates } = event.data;

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

        if (source === "template-renderer-result") {
            setCurrentTemplates(templates);
        }
    };

    useEffect(() => {
        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, [overlays]);

    useEffect(() => {
        const mutationOvserver = new MutationObserver(() => {
            awaitElement(
                "div.absolute.right-2.top-2.z-30 > div.flex.flex-col.gap-4.items-center > div.flex.flex-col.items-center.gap-3",
            ).then((element) => {
                setButtonPortal(element as HTMLDivElement);
            });
        });

        mutationOvserver.observe(document.body, { childList: true, subtree: true });
        return () => mutationOvserver.disconnect();
    }, []);

    return (
        <RouteProvider routes={routes}>
            <div className="App">
                {createPortal(
                    <div
                        className={"btn btn-md shadow-md btn-circle"}
                        onClick={() => setShowOverlay(!showOverlay)}
                    >
                        O
                    </div>,
                    buttonPortal ?? document.body,
                )}
                {showOverlay && <Outlet />}
            </div>
        </RouteProvider>
    );
}

export default App;
