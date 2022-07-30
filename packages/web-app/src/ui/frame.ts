import { ChangeStatus, getDb, TkbDb } from "../db/db";
import { createDelegationHandler } from "../utils/dom-events";
import {
  EditorFrame,
  EditorFrameHeader,
  getEditorHeaderFromSchemaHeader,
  getSchemaHeaderFromEditorHeader,
  transformHeaderBeforeCreate,
  transformHeaderBeforeUpdate,
} from "../utils/header";
import { loadTemplate } from "../utils/template";

const template = loadTemplate(/*html*/ `
<menu>
  <li><button data-command="save">Save</button></li>
</menu>
<pre><code id="frontmatter"></code></pre>
<div contenteditable="plaintext-only"></div>
`);

export class FrameElement extends HTMLElement {
  private db = getDb();
  private mode = getEditorMode(new URLSearchParams(location.search));

  constructor() {
    super();
  }

  async connectedCallback() {
    if (this.mode === "none") return;

    const url = new URL(location.href);
    const frameId = url.searchParams.get("frame");
    if (!frameId) return;

    const dbInstance = await this.db;
    const editableElement = template.querySelector("[contenteditable]")!;
    const headerElement = template.querySelector("#frontmatter")!;
    const { header, body } = await getInitialContent(dbInstance, frameId, this.mode);
    editableElement.innerHTML = body;
    headerElement.innerHTML = JSON.stringify(header, null, 2);

    const handleClick = createDelegationHandler("data-command", {
      save: this.handleSave.bind(this, dbInstance, frameId),
    });

    this.addEventListener("click", handleClick);
    this.appendChild(template);

    console.log(`[editor] loaded ${performance.mark("loaded").startTime.toFixed(2)}ms`);
  }

  private async handleSave(db: TkbDb, frameId: string) {
    const headerText = this.getHeaderText();
    const body = this.getBodyText();

    const transformer = getPreSaveTransformer(this.mode);
    const saveFrame = getFrameSaver(db, this.mode, frameId);
    const frame = transformer({
      header: JSON.parse(headerText) as EditorFrameHeader,
      body,
    });

    const newId = await saveFrame(frame);
    if (newId !== frameId) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set("frame", newId);
      location.search = searchParams.toString();
    } else {
      location.reload();
    }
  }

  private getHeaderText() {
    return this.querySelector("#frontmatter")!.innerHTML;
  }

  private getBodyText() {
    return this.querySelector("[contenteditable]")!.innerHTML;
  }
}

type Mode = "create" | "edit" | "none";
function getEditorMode(searchParams: URLSearchParams): Mode {
  const frameId = searchParams.get("frame");

  if (!frameId) return "none";

  return frameId === "new" ? "create" : "edit";
}

function getPreSaveTransformer(mode: Mode) {
  return mode === "create" ? transformHeaderBeforeCreate : transformHeaderBeforeUpdate;
}
function getFrameSaver(db: TkbDb, mode: Mode, frameId: string) {
  return (frame: EditorFrame) => (mode === "create" ? createFrame(db, frame) : updateFrame(db, frameId, frame));
}

async function getInitialContent(db: TkbDb, frameId: string, mode: Mode): Promise<EditorFrame> {
  switch (mode) {
    case "create":
      return {
        header: {},
        body: "New plaintext frame",
      };
    case "edit":
      const dbFrame = await db.get("frame", frameId);
      if (!dbFrame) throw new Error(`Frame with id ${frameId} not found`);
      return {
        header: getEditorHeaderFromSchemaHeader(dbFrame.header),
        body: dbFrame.body,
      };
    case "none":
      return { header: {}, body: "" };
    default:
      throw new Error("Unknown editor mode");
  }
}

async function createFrame(db: TkbDb, frame: EditorFrame) {
  const id = await db.add("frame", {
    id: crypto.randomUUID(),
    header: getSchemaHeaderFromEditorHeader(frame.header),
    body: frame.body,
    status: ChangeStatus.Create,
  });

  return id;
}

async function updateFrame(db: TkbDb, id: string, frame: EditorFrame) {
  const existingFrame = await db.get("frame", id);
  if (!existingFrame) throw new Error("Error updating: frame no longer exists");

  await db.put("frame", {
    id,
    header: getSchemaHeaderFromEditorHeader(frame.header),
    body: frame.body,
    status: existingFrame.status === ChangeStatus.Create ? ChangeStatus.Create : ChangeStatus.Update,
  });

  return id;
}
