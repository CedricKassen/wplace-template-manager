import { atom } from "jotai";
import { Overlay } from "./overlay";

export const currentTemplates = atom<Overlay[]>([])