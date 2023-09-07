import { history } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { search } from "@codemirror/search";
import type { Extension } from "@codemirror/state";
import { drawSelection, dropCursor, highlightActiveLine, keymap, type KeyBinding } from "@codemirror/view";
import { EditorView } from "codemirror";
import type { RouterElement } from "../router/router-element";
import { defineYamlNodes } from "./code-mirror-ext/custom-tags";
import { frontmatterParser } from "./code-mirror-ext/frontmatter-parser";
import { liveLink } from "./code-mirror-ext/live-link";
import { miniDark } from "./code-mirror-ext/mini-dark";
import { bottomPanel, topPanel } from "./code-mirror-ext/panels";

export interface InitEdidorConfig {
  topPanel: HTMLElement;
  bottomPanel: HTMLElement;
  router: RouterElement;
  editorBindings: KeyBinding[];
  bufferChangeManagerExtension: Extension;
  focusWatcherExtension: Extension;
}

export function initEditor(config: InitEdidorConfig) {
  const {
    topPanel: topPanelElement,
    bottomPanel: bottomPanelElement,
    router: routerElement,
    editorBindings,
    bufferChangeManagerExtension,
    focusWatcherExtension,
  } = config;
  const extensions: Extension[] = [
    bufferChangeManagerExtension,
    focusWatcherExtension,
    liveLink(routerElement),
    history(),
    highlightActiveLine(),
    drawSelection(),
    dropCursor(),
    search(),
    EditorView.lineWrapping,
    markdown({
      base: markdownLanguage,
      extensions: { parseBlock: [frontmatterParser], defineNodes: defineYamlNodes() },
    }),
    topPanel(topPanelElement),
    bottomPanel(bottomPanelElement),
    miniDark(),
    // oneDark,
    keymap.of(editorBindings),
  ];

  const view = new EditorView({
    doc: "",
    extensions,
    parent: document.getElementById("editor-root")!,
  });

  view.focus();
  return view;
}
