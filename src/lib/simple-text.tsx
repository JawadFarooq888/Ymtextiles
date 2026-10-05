import { Fragment, type ReactNode } from "react";

/**
 * Renders the simple formatting the owner types in the admin panel. No HTML is
 * ever interpreted, so content cannot inject scripts.
 *
 *   ## Heading            -> section heading
 *   - item                -> bullet list
 *   blank line            -> new paragraph
 *   **bold**              -> bold
 *   [text](https://...)   -> link (https, mailto:, tel: or /path only)
 */
export function SimpleText({ text }: { text: string }) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n\s*\n/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        if (!lines.length) return null;
        if (lines.length === 1 && /^#{2,3}\s+/.test(lines[0])) {
          return <h2 key={i}>{inline(lines[0].replace(/^#{2,3}\s+/, ""))}</h2>;
        }
        if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        // A heading line followed by text in the same block.
        if (/^#{2,3}\s+/.test(lines[0])) {
          return (
            <Fragment key={i}>
              <h2>{inline(lines[0].replace(/^#{2,3}\s+/, ""))}</h2>
              <p>{joinLines(lines.slice(1))}</p>
            </Fragment>
          );
        }
        return <p key={i}>{joinLines(lines)}</p>;
      })}
    </>
  );
}

function joinLines(lines: string[]): ReactNode {
  return lines.map((l, i) => (
    <Fragment key={i}>
      {i > 0 ? <br /> : null}
      {inline(l)}
    </Fragment>
  ));
}

const SAFE_HREF = /^(https:\/\/|mailto:|tel:|\/(?!\/))/;

function inline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1]) {
      parts.push(<strong key={key++}>{match[1]}</strong>);
    } else if (match[2] && match[3] && SAFE_HREF.test(match[3])) {
      const external = match[3].startsWith("https://");
      parts.push(
        <a
          key={key++}
          href={match[3]}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {match[2]}
        </a>,
      );
    } else {
      parts.push(match[0]);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
