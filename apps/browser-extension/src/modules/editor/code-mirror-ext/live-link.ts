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

const linkDecorator = new MatchDecorator({
  regexp: /https?:\/\/[a-z0-9\._/~%\-\+&\#\?!=\(\)@]*/gi,
  decoration: (match, view) => {
    const url = match[0];
    return Decoration.mark({
      tagName: "a",
      attributes: {
        href: url,
        rel: "nofollow",
        class: "cm-link",
      },
    });
  },
});

class URLView implements PluginValue {
  decorations: RangeSet<Decoration>;
  decorator: MatchDecorator;

  constructor(view: EditorView) {
    this.decorator = linkDecorator;
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

// Prec.high is needed to override "Enter" behavior

export const liveLink: () => Extension = () => Prec.high([urlPlugin, keymap.of([...openLinkAtCursor])]);
