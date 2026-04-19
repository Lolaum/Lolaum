/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { User } from "lucide-react";

interface UserAvatarProps {
  avatarUrl?: string;
  emoji?: string;
  size?: number; // px (default 32)
  className?: string;
}

export default function UserAvatar({
  avatarUrl,
  emoji,
  size = 32,
  className = "",
}: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const sizeClass = `rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden`;

  if (avatarUrl && !imgFailed) {
    return (
      <div
        className={`${sizeClass} ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={avatarUrl}
          alt="프로필"
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  if (emoji) {
    return (
      <div
        className={`${sizeClass} ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        {emoji}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} ${className}`}
      style={{ width: size, height: size }}
    >
      <User size={size * 0.45} className="text-gray-400" />
    </div>
  );
}
