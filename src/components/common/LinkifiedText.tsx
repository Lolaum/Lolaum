import React from "react";

const URL_REGEX = /(https?:\/\/\S+)/g;

interface LinkifiedTextProps {
  text: string;
  className?: string;
  linkClassName?: string;
}

/**
 * 텍스트 안의 URL을 자동으로 클릭 가능한 링크로 렌더링한다.
 * 긴 URL은 줄바꿈되어 부모 박스를 넘치지 않는다.
 */
export default function LinkifiedText({
  text,
  className = "",
  linkClassName = "text-blue-500 underline",
}: LinkifiedTextProps) {
  if (!text) return null;
  const parts = text.split(URL_REGEX);
  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClassName} break-all`}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </p>
  );
}
