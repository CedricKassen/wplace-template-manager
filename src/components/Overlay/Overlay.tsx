import React, { FC, PropsWithChildren, ReactNode } from "react";
import "./Overlay.css";
import { useNavigate } from "../Router/navigate";
import { useSetAtom } from "jotai";
import { showOverlayAtom } from "../../atoms/showOverlay";
import { CloseButton } from "../Buttons/Close";
import { CaretLeftIcon } from "@phosphor-icons/react";

export const Overlay: FC<
    PropsWithChildren<{
        showBack?: boolean;
        headline?: string;
        customRenderer?: ReactNode;
        closeButtonHandler?: () => void;
        noClose?: boolean;
    }>
> = ({ children, headline, showBack, customRenderer, closeButtonHandler, noClose }) => {
    const navigate = useNavigate();
    const setShowOverlay = useSetAtom(showOverlayAtom);

    return (
        <div className="Overlay dropdown-content menu bg-base-100 rounded-box border-base-300 shadow-xl p-4 shadow-md">
            {(showBack || headline) && (
                <nav>
                    <div>
                        {showBack && (
                            <button onClick={() => navigate("/")}>
                                <CaretLeftIcon />
                            </button>
                        )}
                        {headline && <h3 className={"text-lg"}>{headline}</h3>}
                    </div>
                    <div>
                        {customRenderer}
                        {!noClose && (
                            <CloseButton
                                onClick={() => {
                                    closeButtonHandler
                                        ? closeButtonHandler()
                                        : setShowOverlay(false);
                                }}
                            />
                        )}
                    </div>
                </nav>
            )}
            {children}
        </div>
    );
};
