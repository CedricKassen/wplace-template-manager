import { FreeColor, PaidColor } from "../colorMap";

export type Point2D = {
    x: number;
    y: number;
};

export type PixelLocation = {
    pixel: Point2D;
    tile: Point2D;
};

export type Color = keyof typeof FreeColor | keyof typeof PaidColor;
export type ColorValue = FreeColor | PaidColor;

export type Overlay = {
    chunk: [number, number];
    coordinate: [number, number];
    image: string;
    bitmap: ImageBitmap | null;
    height: number;
    width: number;
    templateColors: Color[];
    colorSelection: Color[];
    onlyShowSelectedColors: boolean;
    name: string;
    hidden: boolean;
};

export type CachedTile = {
    blob: Blob;
    baseBlobEtag: string;
    overlaysHash: string;
};

export type TemplateManagerData = {
    tilesCache: Map<number, CachedTile>;
    jumpTo: PixelLocation | null;
    pixelUrlRegex: RegExp;
    filesUrlRegex: RegExp;
    randomTileUrlRegex: RegExp;
};

export type TileRenderRequest = {
    id: string;
    tilesCache: Map<number, CachedTile>;
    baseBlob: Blob;
    baseBlobEtag: string;
    tile: Point2D;
};

export type TileRenderResponse = {
    requestId: string;
    blob: Blob;
};

export type PixelJumpRequest = {
    id: string;
    location: PixelLocation;
};

export type PixelJumpResponse = {
    requestId: string;
};
