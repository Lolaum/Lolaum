import React from "react";

interface AdminIconProps {
  className?: string;
  size?: number;
  active?: boolean;
}

export default function AdminIcon({
  className,
  size = 24,
  active = false,
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 3L20 7V12C20 16.5 16.7 20.7 12 22C7.3 20.7 4 16.5 4 12V7L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
