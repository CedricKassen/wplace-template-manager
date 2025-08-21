import React, { FC, PropsWithChildren, ReactNode } from "react";
import "./Overlay.css";
import { useNavigate } from "../Router/navigate";
import { Chevron } from "../Icons/Chevron";
import { useSetAtom } from "jotai";
import { showOverlayAtom } from "../../atoms/showOverlay";
import { X } from "../Icons/X";

export const Overlay: FC<
    PropsWithChildren<{ showBack?: boolean; headline?: string; customRenderer?: ReactNode }>
> = ({ children, headline, showBack, customRenderer }) => {
    const navigate = useNavigate();
    const setShowOverlay = useSetAtom(showOverlayAtom);

    return (
        <div className="Overlay dropdown-content menu bg-base-100 rounded-box border-base-300 shadow-xl p-4 shadow-md">
            {(showBack || headline) && (
                <nav>
                    <div>
                        {showBack && (
                            <button onClick={() => navigate("/")}>
                                <Chevron className={"icon"} />
                            </button>
                        )}
                        {headline && <h3 className={"text-lg"}>{headline}</h3>}
                    </div>
                    <div>
                        {customRenderer}
                        <button
                            onClick={() => {
                                setShowOverlay(false);
                            }}
                        >
                            <X className={"icon mobile-only"} />
                        </button>
                    </div>
                </nav>
            )}
            {children}
        </div>
    );
};
