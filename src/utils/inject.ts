export function inject(callback: () => void) {
    const script = document.createElement("script");
    script.textContent = `(${callback})();`;
    document.documentElement?.appendChild(script);
    // script.remove();
}
