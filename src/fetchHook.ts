import {
    CachedTile,
    Point2D,
    TemplateManagerData,
    TileRenderRequest,
    TileRenderResponse,
} from "./utils/types";

export function fetchHook() {
    console.log("injecting fetchHook...");

    const sharedData: TemplateManagerData = {
        tilesCache: new Map<number, CachedTile>(),
        jumpTo: null,
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
        const { source, tile, pixel } = event.data || {};
        if (source === "overlay-jump-to") {
            console.log(event.data);
            sharedData.jumpTo = {
                pixel,
                tile,
            };
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
            if (sharedData.jumpTo) {
                console.log("randomTile request changed to", sharedData.jumpTo);
                const jumpToJson = JSON.stringify(sharedData.jumpTo);
                sharedData.jumpTo = null;
                return new Response(jumpToJson, {
                    headers: { "Content-Type": "application/json" },
                });
            }
        } else if (sharedData.pixelUrlRegex.test(request.url)) {
            const m = sharedData.pixelUrlRegex.exec(request.url);
            if (m) {
                const [, tileX, tileY, pixelX, pixelY] = m;
                const tile: Point2D = { x: parseInt(tileX, 10), y: parseInt(tileY, 10) };
                const pixel: Point2D = { x: parseInt(pixelX, 10), y: parseInt(pixelY, 10) };
                console.log("pixel location request called at", { tile, pixel });
                window.postMessage({
                    source: "overlay-setPosition",
                    tile,
                    pixel,
                });
            }
        }

        const response = await originalFetch.call(window, request);

        if (response.ok && sharedData.filesUrlRegex.test(request.url)) {
            const m = sharedData.filesUrlRegex.exec(request.url);
            if (m) {
                const [, tileX, tileY] = m;
                const origBlob = await response.blob();
                const tile: Point2D = { x: parseInt(tileX, 10), y: parseInt(tileY, 10) };
                console.log("tile image request called at", tile);

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
                    const request: TileRenderRequest = {
                        id: crypto.randomUUID(),
                        tilesCache: sharedData.tilesCache,
                        baseBlob: origBlob,
                        baseBlobEtag: etag,
                        tile,
                    };
                    const handleResponse = (event: Event) => {
                        const customEvent = event as CustomEvent<TileRenderResponse>;
                        const response = customEvent.detail;
                        if (response.requestId === request.id) {
                            window.removeEventListener("overlay-render-response", handleResponse);
                            resolve(response.blob);
                        }
                    };
                    window.addEventListener("overlay-render-response", handleResponse);
                    window.dispatchEvent(
                        new CustomEvent<TileRenderRequest>("overlay-render-request", {
                            detail: request,
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
}
