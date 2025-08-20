import React, { useEffect, useState } from "react";
import "./App.css";
import { Button } from "./components/Button/Button";
import { RouteProvider } from "./components/Router/RouteContext";
import { Outlet } from "./components/Router/Outlet";
import { Overview } from "./pages/Overview";
import { Create } from "./pages/Create";
import { Import } from "./pages/Import";
import { Edit } from "./pages/Edit";
import { BlobEventData } from "./fetch";
import { renderSquares } from "./utils/renderSquares";
import { useSetAtom, useAtomValue } from "jotai";
import { overlayAtom } from "./atoms/overlay";
import { positionAtom } from "./atoms/position";
import { currentTemplates } from "./atoms/currentTemplates";

const routes = new Map([
    ["/", <Overview />],
    ["/create", <Create />],
    ["/import", <Import />],
    ["/edit/{name}", <Edit />],
]);

function App() {
    const [showOverlay, setShowOverlay] = useState(false);
    const setPosition = useSetAtom(positionAtom);
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

    return (
        <RouteProvider routes={routes}>
            <div className="App">
                <Button onClick={() => setShowOverlay(!showOverlay)} />
                {showOverlay && <Outlet />}
            </div>
        </RouteProvider>
    );
}

export default App;
