import React, { FC, SVGProps } from "react";

export const X: FC<SVGProps<any>> = (props) => {
    return (
        <svg
            {...props}
            viewBox="0 -960 960 960"
            fill="currentColor"
            className="size-4"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"></path>
        </svg>
    );
};
