import { Overlay } from "../utils/types";
import { atomWithStorage } from "jotai/utils";
import { createIDBStorage } from "../utils/idbStorage";

const idbStorage = createIDBStorage<Overlay[]>();

export const overlayAtom = atomWithStorage<Overlay[]>("overlays", [], idbStorage);
