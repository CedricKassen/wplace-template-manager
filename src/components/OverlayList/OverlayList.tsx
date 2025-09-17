import { PixelLocation } from "../../utils/types";
import "./OverlayList.css";
import React, { FC, useMemo } from "react";
import { OverlayListEntry } from "./OverlayListEntry";
import { useAtom } from "jotai";
import { overlayAtom } from "../../atoms/overlay";

export const OverlayList: FC = () => {
    const [overlays, setOverlays] = useAtom(overlayAtom);

    const toggleVisibility = (currentlyHidden: boolean, index: number) => {
        setOverlays([
            ...overlays.slice(0, index),
            { ...overlays[index], hidden: !currentlyHidden },
            ...overlays.slice(index + 1),
        ]);
    };

    const overlaysList = useMemo(
        () =>
            overlays.map(({ image, name, chunk, coordinate, hidden, width, height }, index) => {
                const location: PixelLocation = {
                    tile: {
                        x: chunk[0],
                        y: chunk[1],
                    },
                    pixel: {
                        x: coordinate[0],
                        y: coordinate[1],
                    },
                };
                return (
                    <OverlayListEntry
                        name={name}
                        image={image}
                        key={name}
                        location={location}
                        isHidden={hidden}
                        toggleVisiblity={() => toggleVisibility(hidden, index)}
                        width={width}
                        height={height}
                    />
                );
            }),
        [overlays],
    );

    return (
        <table className={"table max-sm:text-sm"}>
            <tbody>{overlaysList}</tbody>
        </table>
    );
};
