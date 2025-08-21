import { formatString } from "../../utils/formatString";
import React, { ChangeEvent, FC } from "react";
import { Color, FreeColor, PaidColor } from "../../colorMap";

export const ColorCheckbox: FC<{
    checked?: boolean;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    name: Color;
    color: FreeColor | PaidColor;
}> = ({ checked, onChange, name, color }) => {
    return (
        <label className={"ColorCheckbox"}>
            <input
                type={"checkbox"}
                checked={checked}
                onChange={onChange}
                style={{ backgroundColor: color }}
            />
            <span>{formatString(name)}</span>
        </label>
    );
};
