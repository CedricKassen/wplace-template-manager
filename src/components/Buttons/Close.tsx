import React, { ButtonHTMLAttributes, DetailedHTMLProps, FC } from "react";
import { X } from "../Icons/X";

export const CloseButton: FC<
    DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
> = (props) => {
    return (
        <button className={"btn btn-circle btn-sm"} {...props}>
    <X />
    </button>
);
};