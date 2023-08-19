import { Prec, RangeSet, type Extension } from "@codemirror/state";
import {
  Decoration,
  MatchDecorator,
  ViewPlugin,
  ViewUpdate,
  keymap,
  type Command,
  type KeyBinding,
  type PluginValue,
} from "@codemirror/view";
import { EditorView } from "codemirror";
import type { RouterElement } from "../../router/router-element";
import "./live-link.css";

const GLOBAL_ABSOLUTE_URL_PATTERN = /https?:\/\/[a-z0-9\._/~%\-\+&\#\?!=\(\)@]*/gi;
const URL_PATTERN = /^https?:\/\/[a-z0-9\._/~%\-\+&\#\?!=\(\)@]*$/i;
const GLOBAL_URL_OR_MARKDOWN_LINK_PATTERN = /(https?:\/\/[a-z0-9\._/~%\-\+&\#\?!=\(\)@]*)|(\[([^\[\]]+?)\]\((.+?)\))/gi;
const GLOBAL_MARKDOWN_LINK_PATTERN = /\[([^\[\]]+?)\]\((.+?)\)/gi; // `[title](target)`
const INTENRAL_ID_PATTERN = /\d+/;

export function isAbsoluteUrl(url: string) {
  return URL_PATTERN.test(url);
}

// Prec.high is needed to override "Enter" behavior
// markdown link should be registered after url link to exclude the trailing ")" from the parsed url

export const liveLink: (router: RouterElement) => Extension = (router) =>
  Prec.high([liveLinkPlugin(router), keymap.of([...openLinkAtCursor(router)])]);

export const openLinkAtCursor: (router: RouterElement) => KeyBinding[] = (router) => [
  {
    key: "Enter",
    run: openLinkOnEnter(router, "_self"),
  },
  {
    key: "Mod-Enter",
    run: openLinkOnEnter(router, "_blank"),
  },
  {
    key: "Mod-Shift-Enter", // browser seems to automatically focus the new tab when shift is pressed
    run: openLinkOnEnter(router, "_blank"),
  },
];

function openLinkOnEnter(router: RouterElement, target: "_self" | "_blank"): Command {
  return (view: EditorView) => {
    // determine type of link
    const anchor = getAnchorFromView(view);
    if (!anchor) return false;

    if (isExternalAnchor(anchor)) {
      return openExternalLink(view, target);
    } else {
      return openInternalLink(view, router, target);
    }
  };
}

export const openExternalLink = (view: EditorView, target?: "_self" | "_blank") => {
  const anchor = getAnchorFromView(view);
  if (!anchor) return false;

  if (isEdgeOfUrlLink(view)) return false;
  if (isEdgeOfMarkdownLink(view)) return false;

  window.open(anchor.href, anchor.target ? anchor.target : target);
  return true;
};

export function openInternalLink(view: EditorView, router: RouterElement, target: "_self" | "_blank") {
  const anchor = getAnchorFromView(view);
  if (!anchor) return false;

  if (isEdgeOfMarkdownLink(view)) return false;

  if (target === "_blank") {
    window.open(anchor.href, "_blank");
  } else {
    router.push(anchor.href);
  }
  return true;
}

function isEdgeOfMarkdownLink(view: EditorView) {
  const selectionLine = view.state.doc.lineAt(view.state.selection.main.from);
  const textBeforeSelection = selectionLine.text.slice(0, view.state.selection.main.from - selectionLine.from);
  const markdownLinkMatch = [...textBeforeSelection.matchAll(GLOBAL_MARKDOWN_LINK_PATTERN)].pop()?.[0];
  if (markdownLinkMatch && markdownLinkMatch === textBeforeSelection.slice(-markdownLinkMatch.length)) return true;

  return false;
}

function isEdgeOfUrlLink(view: EditorView) {
  // check if text before selection ends with a url
  // also check if the text after selection joined with the text before selection is a url
  const selectionLine = view.state.doc.lineAt(view.state.selection.main.from);
  const textBeforeSelection = selectionLine.text.slice(0, view.state.selection.main.from - selectionLine.from);
  const externalUrlMatch = [...textBeforeSelection.matchAll(GLOBAL_ABSOLUTE_URL_PATTERN)].pop()?.[0];
  if (!externalUrlMatch) return false;

  const cursorAfterUrl = externalUrlMatch === textBeforeSelection.slice(-externalUrlMatch.length);
  const textAfterSelection = selectionLine.text.slice(view.state.selection.main.to - selectionLine.from);
  if (!textAfterSelection) return true;

  const joinedText = externalUrlMatch + textAfterSelection;
  const fullUrlMatch = joinedText.match(GLOBAL_ABSOLUTE_URL_PATTERN)![0];
  const cursorInsideUrl = joinedText.indexOf(fullUrlMatch) === 0;

  return cursorAfterUrl && !cursorInsideUrl;
}

function getAnchorFromView(view: EditorView) {
  const { to } = view.state.selection.main;
  const { node } = view.domAtPos(to);
  const anchor = node.parentElement?.closest("a") ?? null;
  return anchor;
}

const liveLinkPlugin = (router: RouterElement) =>
  ViewPlugin.fromClass(LiveLinkView, {
    decorations: (v) => v.decorations,
    eventHandlers: {
      click: handleLinkClick(router),
    },
  });

class LiveLinkView implements PluginValue {
  decorations: RangeSet<Decoration>;
  decorator: MatchDecorator;

  constructor(view: EditorView) {
    this.decorator = new MatchDecorator({
      regexp: GLOBAL_URL_OR_MARKDOWN_LINK_PATTERN,
      decoration: (match, view) => {
        const [_, fullUrl, _bracket, bracketTitle, bracketIdOrUrl] = match;
        const isInternal = bracketIdOrUrl && isInternalId(bracketIdOrUrl);
        return Decoration.mark({
          tagName: "a",
          attributes: {
            href: isInternal
              ? `?title=${encodeURIComponent(bracketTitle)}&id=${bracketIdOrUrl}`
              : bracketIdOrUrl ?? fullUrl,
            rel: isInternal ? "" : "external noopener noreferrer",
            class: "cm-live-link",
          },
        });
      },
    });
    this.decorations = this.decorator.createDeco(view);
  }
  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.decorator.updateDeco(update, this.decorations);
    }
  }
}

function handleLinkClick(router: RouterElement): (this: LiveLinkView, e: MouseEvent, view: EditorView) => boolean {
  return function (this, e, view) {
    // only handle internal live link clicks
    const target = e.target as HTMLAnchorElement;
    if (!target?.classList.contains("cm-live-link")) return false;

    const openTarget = e.ctrlKey ? "_blank" : "_self";

    if (isExternalAnchor(target)) {
      return openExternalLink(view, openTarget);
    } else {
      return openInternalLink(view, router, openTarget);
    }
  };
}

function isExternalAnchor(anchor: HTMLAnchorElement) {
  return anchor.rel.includes("external");
}

function isInternalId(idOrUrl: string) {
  return !GLOBAL_ABSOLUTE_URL_PATTERN.exec(idOrUrl) && !!INTENRAL_ID_PATTERN.exec(idOrUrl);
}
