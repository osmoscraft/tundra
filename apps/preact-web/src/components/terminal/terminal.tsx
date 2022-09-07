import { useState } from "preact/hooks";

export interface TerminalProps {
  entries: TerminalEntry[];
}
export interface TerminalEntry {
  key: string | number;
  timestamp: Date;
  content: string;
}
export function Terminal(props: TerminalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <output class="c-terminal" data-is-expanded={isExpanded}>
      <button onClick={() => setIsExpanded((prev) => !prev)}>Toggle</button>
      {props.entries.slice(isExpanded ? undefined : props.entries.length - 1).map((entry) => (
        <div key={entry.key}>
          [{entry.timestamp.toISOString()}] {entry.content}
        </div>
      ))}
    </output>
  );
}
