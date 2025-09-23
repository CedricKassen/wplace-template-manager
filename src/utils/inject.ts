export function inject(callback: () => void, opts: { keep?: boolean; debugName?: string } = {}) {
    const { keep = false, debugName = "userscript-injected.js" } = opts;

    // Name the code for DevTools ergonomics.
    const code = `(${callback})();\n//# sourceURL=${debugName}`;

    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const script = document.createElement("script");
    script.src = url;

    script.onload = () => {
        if (!keep) URL.revokeObjectURL(url); // safe after load; avoids leaks
        script.remove();
    };

    (document.head || document.documentElement).appendChild(script);

    // ensure cleanup even if onload never fires.
    if (!keep) {
        window.addEventListener("beforeunload", () => URL.revokeObjectURL(url));
    }
}
