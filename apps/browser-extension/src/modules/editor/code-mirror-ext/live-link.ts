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
import { noteIdToPath } from "../../sync/path";
import "./live-link.css";

const ABSOLUTE_URL_PATTERN = /https?:\/\/[a-z0-9\._/~%\-\+&\#\?!=\(\)@]*/gi;
const TITLED_LINK_PATTERN = /\[([^\[\]]+?)\]\((.+?)\)/gi; // `[title](target)`
const INTENRAL_LINK_PATTERN = /\d+/;

// Prec.high is needed to override "Enter" behavior
// markdown link should be registered after url link to exclude the trailing ")" from the parsed url

export const liveLink: () => Extension = () =>
  Prec.high([markdownLinkPlugin, urlPlugin, keymap.of([...openLinkAtCursor])]);

export const openSelectedUrl: Command = (view: EditorView) => {
  const anchor = getAnchorFromView(view);
  if (!anchor) return false;
  window.open(anchor.href, anchor.target);
  return true;
};

export const openSelectedUrlInCurrentTab: Command = (view: EditorView) => {
  const anchor = getAnchorFromView(view);
  if (!anchor) return false;
  window.open(anchor.href, "_self");
  return true;
};

export const openSelectedUrlInNewTab: Command = (view: EditorView) => {
  const anchor = getAnchorFromView(view);
  if (!anchor) return false;
  window.open(anchor.href, "_blank");
  return true;
};

function getAnchorFromView(view: EditorView) {
  const { to } = view.state.selection.main;
  const { node } = view.domAtPos(to);
  const anchor = node.parentElement?.closest("a") ?? null;
  return anchor;
}

export const openLinkAtCursor: KeyBinding[] = [
  {
    key: "Enter",
    run: openSelectedUrlInCurrentTab,
  },
  {
    key: "Mod-Enter",
    run: openSelectedUrlInNewTab,
  },
];

class MarkdownLinkView implements PluginValue {
  decorations: RangeSet<Decoration>;
  decorator: MatchDecorator;

  constructor(view: EditorView) {
    this.decorator = new MatchDecorator({
      regexp: TITLED_LINK_PATTERN,
      decoration: (match, view) => {
        // TODO handle non-id links
        const [_, title, url] = match;
        const isInternal = isInternalUrl(url);
        return Decoration.mark({
          tagName: "a",
          attributes: {
            href: isInternal
              ? `?title=${encodeURIComponent(title)}&path=${encodeURIComponent(noteIdToPath(url))}`
              : url,
            rel: "nofollow",
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

function isInternalUrl(url: string) {
  return !!INTENRAL_LINK_PATTERN.exec(url);
}

const markdownLinkPlugin = ViewPlugin.fromClass(MarkdownLinkView, {
  decorations: (v) => v.decorations,
  eventHandlers: {
    click: handleUrlClick,
  },
});

class URLView implements PluginValue {
  decorations: RangeSet<Decoration>;
  decorator: MatchDecorator;

  constructor(view: EditorView) {
    this.decorator = new MatchDecorator({
      regexp: ABSOLUTE_URL_PATTERN,
      decoration: (match, view) => {
        const url = match[0];
        return Decoration.mark({
          tagName: "a",
          attributes: {
            href: url,
            rel: "nofollow",
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

const urlPlugin = ViewPlugin.fromClass(URLView, {
  decorations: (v) => v.decorations,
  eventHandlers: {
    click: handleUrlClick,
  },
});

function handleUrlClick(this: URLView, e: MouseEvent, view: EditorView) {
  if (e.ctrlKey) {
    return openSelectedUrlInNewTab(view);
  } else {
    return openSelectedUrlInCurrentTab(view);
  }
}
