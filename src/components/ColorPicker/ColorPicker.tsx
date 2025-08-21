import React, {
    ChangeEvent,
    Dispatch,
    FC,
    SetStateAction,
    useMemo,
    useState,
    useEffect,
} from "react";
import { Color, FreeColor, FreeColorMap, PaidColor, PaidColorMap } from "../../colorMap";
import { formatString } from "../../utils/formatString";
import { ColorCheckbox } from "../ColorCheckbox/ColorCheckbox";

export const ColorPicker: FC<{
    colorList?: Color[];
    setSelectedColorState: Dispatch<SetStateAction<Color[]>>;
    selectedColorState: Color[];
}> = ({ colorList, selectedColorState, setSelectedColorState }) => {
    const [search, setSearch] = useState<string>("");
    const [allFree, setAllFree] = useState<boolean>(true);
    const [allPaid, setAllPaid] = useState<boolean>(true);

    /*
     * Handle check all button for free colors
     */

    const availableFreeColors = useMemo(() => {
        return Array.from(FreeColorMap.keys()).filter((key) =>
            colorList?.length ? colorList.includes(key) : true,
        );
    }, [colorList]);

    useEffect(() => {
        const allFreeColorsSelected = availableFreeColors.every((color) =>
            selectedColorState.includes(color),
        );

        setAllFree(allFreeColorsSelected);
    }, [selectedColorState, availableFreeColors]);

    const handleAllFreeChange = (event: ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        setAllFree(checked);

        if (checked) {
            setSelectedColorState((prev) => {
                const newSelection = [...prev];
                availableFreeColors.forEach((color) => {
                    if (!newSelection.includes(color)) {
                        newSelection.push(color);
                    }
                });
                return newSelection;
            });
        } else {
            setSelectedColorState((prev) =>
                prev.filter(
                    (color) => !availableFreeColors.includes(color as keyof typeof FreeColor),
                ),
            );
        }
    };

    /*
     * Handle check all button for free colors
     */

    const availablePaidColors = useMemo(() => {
        return Array.from(PaidColorMap.keys()).filter((key) =>
            colorList?.length ? colorList.includes(key) : true,
        );
    }, [colorList]);

    useEffect(() => {
        const allPaidColorsSelected = availablePaidColors.every((color) =>
            selectedColorState.includes(color),
        );

        setAllPaid(allPaidColorsSelected);
    }, [selectedColorState, availablePaidColors]);

    const handleAllPaidChange = (event: ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        setAllPaid(checked);

        if (checked) {
            setSelectedColorState((prev) => {
                const newSelection = [...prev];
                availablePaidColors.forEach((color) => {
                    if (!newSelection.includes(color)) {
                        newSelection.push(color);
                    }
                });
                return newSelection;
            });
        } else {
            setSelectedColorState((prev) =>
                prev.filter(
                    (color) => !availablePaidColors.includes(color as keyof typeof PaidColor),
                ),
            );
        }
    };

    /*
     * The Rest (TM)
     */

    const colorCheckboxOnchange = (event: ChangeEvent<HTMLInputElement>, key: Color) => {
        if (event.target.checked) {
            setSelectedColorState((prev) => [...prev, key]);
        } else {
            setSelectedColorState((prev) => prev.filter((color) => color !== key));
        }
    };

    const createColorCheckRenderer = (input: IterableIterator<any>) => {
        return Array.from(input)
            .filter(([key]: any) => {
                return colorList?.length ? colorList.includes(key) : true;
            })
            .filter(([key]: any) => formatString(key).toLowerCase().includes(search.toLowerCase()))
            .map(([key, value]: any) => {
                return (
                    <ColorCheckbox
                        key={key + "-" + value}
                        onChange={(event) => colorCheckboxOnchange(event, key)}
                        color={value}
                        name={key}
                        checked={selectedColorState.includes(key)}
                    />
                );
            });
    };

    const ColorCheckRenderer = useMemo(() => {
        return createColorCheckRenderer(FreeColorMap.entries());
    }, [FreeColorMap, search, selectedColorState]);

    const PaidColorCheckRenderer = useMemo(() => {
        return createColorCheckRenderer(PaidColorMap.entries());
    }, [FreeColorMap, search, selectedColorState]);

    return (
        <>
            <label className={"input w-full desktop-auto"}>
                <span className="label">Search</span>
                <input
                    type={"search"}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={"Color Name"}
                    onKeyDown={(event) => {
                        event.stopPropagation();
                    }}
                />
            </label>
            <label>
                <input
                    type={"checkbox"}
                    style={{ marginRight: "10px" }}
                    checked={allFree}
                    onChange={handleAllFreeChange}
                />
                Free Colors
            </label>
            <div className={"Grid"}>{ColorCheckRenderer}</div>
            <label>
                <input
                    type={"checkbox"}
                    style={{ marginRight: "10px" }}
                    checked={allPaid}
                    onChange={handleAllPaidChange}
                />
                Paid colors
            </label>
            <div className={"Grid"}>{PaidColorCheckRenderer}</div>
        </>
    );
};
