export interface HaikuFragment {
  type: "fragment";
  children: HaikuLine[];
}

export interface HaikuLine {
  type: "line";
  isHeadOpen?: boolean;
  isTailOpen?: boolean;
  depth?: number; // exists when head is closed
  children: HaikuInline[];
}

export type HaikuInline = HaikuText | HaikuLink | HaikuLeader;

export interface HaikuText {
  type: "text";
  text: string;
}
export interface HaikuLink {
  type: "link";
  text: string;
  href: string;
}
export interface HaikuLeader {
  type: "leader";
  text: string;
}
