import { className } from "@babylonjs/core";
import React from "react";

export const Button = (props: {
  children: React.ReactNode;
  onClick?: (evt: any) => void;
  className?: string;
}) => {
  return (
    <button className={`btn btn-secondary ${className}`} onClick={props.onClick}>
      {props.children}
    </button>
  );
};
