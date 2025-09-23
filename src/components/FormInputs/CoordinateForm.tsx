import React, { Dispatch, FC, SetStateAction } from "react";
import { useAtom } from "jotai/index";
import { positionAtom } from "../../atoms/position";
import { MapPinIcon } from "@phosphor-icons/react";

export const CoordinateForm: FC<{
    chunkValue: number[];
    coordinateValue: number[];
    setChunkValue: Dispatch<SetStateAction<number[]>>;
    setCoordinateValue: Dispatch<SetStateAction<number[]>>;
    hidePostitionButton?: boolean;
}> = ({ chunkValue, coordinateValue, setChunkValue, setCoordinateValue, hidePostitionButton }) => {
    const [position] = useAtom(positionAtom);

    return (
        <div className={"row"} style={{ flexWrap: "nowrap" }}>
            <div className={"row"}>
                <label className={"input"}>
                    <span className="label">CX</span>
                    <input
                        placeholder={"Chunk"}
                        type={"number"}
                        value={chunkValue[0]}
                        onChange={(event) =>
                            setChunkValue(([x, y]) => [Number(event.target.value), y])
                        }
                    />
                </label>
                <label className={"input"}>
                    <span className="label">CY</span>
                    <input
                        placeholder={"Chunk"}
                        type={"number"}
                        value={chunkValue[1]}
                        onChange={(event) =>
                            setChunkValue(([x, y]) => [x, Number(event.target.value)])
                        }
                    />
                </label>
                <label className={"input"}>
                    <span className="label">PX</span>
                    <input
                        placeholder={"Pos."}
                        type={"number"}
                        value={coordinateValue[0]}
                        onChange={(event) =>
                            setCoordinateValue(([x, y]) => [Number(event.target.value), y])
                        }
                    />
                </label>
                <label className={"input"}>
                    <span className="label">PY</span>
                    <input
                        placeholder={"Pos."}
                        type={"number"}
                        value={coordinateValue[1]}
                        onChange={(event) =>
                            setCoordinateValue(([x, y]) => [x, Number(event.target.value)])
                        }
                    />
                </label>
            </div>
            {!hidePostitionButton && (
                <button
                    className={"btn btn-md"}
                    onClick={() => {
                        if (position?.pixel && position?.tile) {
                            setChunkValue([position.tile.x, position.tile.y]);
                            setCoordinateValue([position.pixel.x, position.pixel.y]);
                        }
                    }}
                >
                    <MapPinIcon />
                </button>
            )}
        </div>
    );
};
