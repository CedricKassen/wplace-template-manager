import { inject } from "./utils/inject";
import { CachedTile } from "./utils/renderSquares";

export type TemplateManagerData = {
    tilesCache: Map<number, CachedTile>;
    jumpTo: {
        pixel: { x: number; y: number } | null;
        tile: { x: number; y: number } | null;
    };
    pixelUrlRegex: RegExp;
    filesUrlRegex: RegExp;
    randomTileUrlRegex: RegExp;
};

inject(() => {
    console.log("injecting fetchHook...");

    const sharedData: TemplateManagerData = {
        tilesCache: new Map<number, CachedTile>(),
        jumpTo: {
            pixel: null,
            tile: null,
        },
        pixelUrlRegex: new RegExp(
            "^https://backend\\.wplace\\.live/s\\d+/pixel/(\\d+)/(\\d+)\\?x=(\\d+)&y=(\\d+)$",
        ),
        filesUrlRegex: new RegExp(
            "^https://backend\\.wplace\\.live/files/s\\d+/tiles/(\\d+)/(\\d+)\\.png$",
        ),
        randomTileUrlRegex: new RegExp("^https://backend\\.wplace\\.live/s\\d+/tile/random$"),
    };

    // @ts-ignore
    window.templateManagerData = sharedData;

    window.addEventListener("message", (event: MessageEvent) => {
        const { source, chunk, position } = event.data || {};
        if (source === "overlay-jump-to") {
            console.log(event.data);
            sharedData.jumpTo.pixel = position;
            sharedData.jumpTo.tile = chunk;
            event.preventDefault();
        }
    });

    const originalFetch = window.fetch;
    window.fetch = async function (
        input: RequestInfo | URL,
        init?: RequestInit,
    ): Promise<Response> {
        const request = new Request(input, init);

        if (sharedData.randomTileUrlRegex.test(request.url)) {
            console.log("randomTile request called");
            if (sharedData.jumpTo.pixel && sharedData.jumpTo.tile) {
                console.log("randomTile request changed to", sharedData.jumpTo);
                const jumpResponse = new Response(JSON.stringify(sharedData.jumpTo), {
                    headers: { "Content-Type": "application/json" },
                });
                sharedData.jumpTo.pixel = null;
                sharedData.jumpTo.tile = null;
                return jumpResponse;
            }
        } else if (sharedData.pixelUrlRegex.test(request.url)) {
            const m = sharedData.pixelUrlRegex.exec(request.url);
            if (m) {
                const [, chunkX, chunkY, positionX, positionY] = m;
                const chunk = { x: parseInt(chunkX, 10), y: parseInt(chunkY, 10) };
                const position = { x: parseInt(positionX, 10), y: parseInt(positionY, 10) };
                console.log("pixel request called at", { chunk, position });
                window.postMessage({
                    source: "overlay-setPosition",
                    chunk,
                    position,
                });
            }
        }

        const response = await originalFetch.call(window, request);

        if (response.ok && sharedData.filesUrlRegex.test(request.url)) {
            const m = sharedData.filesUrlRegex.exec(request.url);
            if (m) {
                const [, chunkX, chunkY] = m;
                const origBlob = await response.blob();
                const chunk = { x: parseInt(chunkX, 10), y: parseInt(chunkY, 10) };
                console.log("tile image request called at", chunk);

                let etag = response.headers.get("etag");
                // currently there is a misconfiguration in the backend which doesn't allow us to get the response headers
                if (!etag) {
                    const buffer = await origBlob.arrayBuffer();
                    const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
                    const hashBytes = new Uint8Array(hashBuffer);
                    etag = "";
                    for (let i = 0; i < hashBytes.length; i++) {
                        etag += hashBytes[i].toString(16).padStart(2, "0");
                    }
                }

                const overlayBlob = await new Promise<Blob>((resolve) => {
                    const requestId = Math.random().toString();
                    const handleResponse = (event: Event) => {
                        const customEvent = event as CustomEvent;
                        if (customEvent.detail.requestId === requestId) {
                            window.removeEventListener("overlay-render-response", handleResponse);
                            resolve(customEvent.detail.blob);
                        }
                    };
                    window.addEventListener("overlay-render-response", handleResponse);
                    window.dispatchEvent(
                        new CustomEvent("overlay-render-request", {
                            detail: {
                                requestId,
                                tilesCache: sharedData.tilesCache,
                                blob: origBlob,
                                etag,
                                chunk,
                            },
                        }),
                    );
                });
                return new Response(overlayBlob, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                });
            }
        }

        return response;
    };

    console.log("injected fetchHook!");
});
