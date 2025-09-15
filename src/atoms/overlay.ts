import { Overlay } from "../utils/types";
import { atomWithStorage } from "jotai/utils";

export const overlayAtom = atomWithStorage<Overlay[]>("overlays", []);
