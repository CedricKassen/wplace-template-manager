import React, { FC } from "react";
import { OverlayList } from "../components/OverlayList/OverlayList";
import { Overlay } from "../components/Overlay/Overlay";
import { useNavigate } from "../components/Router/navigate";

export const Overview: FC = () => {
    const navigate = useNavigate();
    return (
        <Overlay
            headline={"Template Manager"}
            customRenderer={
                <button
                    className={"btn btn-sm"}
                    onClick={() => {
                        navigate("/import");
                    }}
                >
                    Import Template
                </button>
            }
        >
            <OverlayList />
            <button
                className={"btn btn-primary"}
                onClick={() => {
                    navigate("/create");
                }}
            >
                Create new Template
            </button>
        </Overlay>
    );
};
