import "./terminal.css";

export interface TerminalProps {
  isExpanded: boolean;
  onToggle: () => any;
  entries: TerminalEntry[];
}
export interface TerminalEntry {
  key: string | number;
  timestamp: Date;
  content: string;
}
export function Terminal(props: TerminalProps) {
  return (
    <output class="c-terminal" data-is-expanded={props.isExpanded}>
      <button class="c-terminal__toggle" onClick={props.onToggle}>
        Toggle
      </button>
      {props.entries.slice(props.isExpanded ? undefined : props.entries.length - 1).map((entry) => (
        <div key={entry.key}>
          [{entry.timestamp.toISOString()}] {entry.content}
        </div>
      ))}
    </output>
  );
}
