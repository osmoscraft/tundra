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

const ABSOLUTE_URL_PATTERN = /https?:\/\/[a-z0-9\._/~%\-\+&\#\?!=\(\)@]*/gi;
const TITLED_LINK_PATTERN = /\[([^\[\]]+?)\]\((.+?)\)/gi; // `[title](target)`
const INTENRAL_LINK_PATTERN = /\d+/;

// Prec.high is needed to override "Enter" behavior
// markdown link should be registered after url link to exclude the trailing ")" from the parsed url

export const liveLink: (router: RouterElement) => Extension = (router) =>
  Prec.high([markdownLinkPlugin(router), urlPlugin(router), keymap.of([...openLinkAtCursor(router)])]);

export const openSelectedUrlInCurrentTab: (router: RouterElement) => Command = (router) => (view: EditorView) => {
  const anchor = getAnchorFromView(view);
  if (!anchor) return false;
  router.push(anchor.href);
  return true;
};

export const openSelectedUrlInNewTab: () => Command = () => (view: EditorView) => {
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

export const openLinkAtCursor: (router: RouterElement) => KeyBinding[] = (router) => [
  {
    key: "Enter",
    run: openSelectedUrlInCurrentTab(router),
  },
  {
    key: "Mod-Enter",
    run: openSelectedUrlInNewTab(),
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
        const [_, title, idOrUrl] = match;
        const isInternal = isInternalUrl(idOrUrl);
        return Decoration.mark({
          tagName: "a",
          attributes: {
            href: isInternal ? `?title=${encodeURIComponent(title)}&id=${idOrUrl}` : idOrUrl,
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

const markdownLinkPlugin = (router: RouterElement) =>
  ViewPlugin.fromClass(MarkdownLinkView, {
    decorations: (v) => v.decorations,
    eventHandlers: {
      click: handleUrlClick(router),
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

const urlPlugin = (router: RouterElement) => {
  return ViewPlugin.fromClass(URLView, {
    decorations: (v) => v.decorations,
    eventHandlers: {
      click: handleUrlClick(router),
    },
  });
};

function handleUrlClick(router: RouterElement): (this: URLView, e: MouseEvent, view: EditorView) => boolean {
  const openInNewTab = openSelectedUrlInNewTab();
  const openInCurrentTab = openSelectedUrlInCurrentTab(router);

  return function (this, e, view) {
    if (e.ctrlKey) {
      return openInNewTab(view);
    } else {
      return openInCurrentTab(view);
    }
  };
}
