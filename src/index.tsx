import React from "react";
import { createRoot } from "react-dom/client";
import { addLocationChangeCallback } from "./utils/addLocationChangeCallback";
import { log } from "./utils/log";
import { awaitElement } from "./utils/awaitElement";
import App from "./App";
import { fetchHook } from "./fetchHook";
import { inject } from "./utils/inject";

log("wplace.live Template Manager successfully loaded.");

async function main() {
    const body = await awaitElement("body");

    const container = document.createElement("div");
    body.appendChild(container);

    inject(fetchHook, { keep: false, debugName: "fetchHook.js" });
    const root = createRoot(container);
    root.render(<App />);
}

addLocationChangeCallback(() => {
    main().catch((e) => {
        log(e);
    });
});
