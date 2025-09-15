import { atom } from "jotai";

export const positionAtom = atom<{
    position: { x?: number; y?: number };
    chunk: { x?: number; y?: number };
}>({
    position: { x: undefined, y: undefined },
    chunk: { x: undefined, y: undefined },
});
