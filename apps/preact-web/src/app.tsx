import { render } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { CommandPalette } from "./components/command-palette/command-palette";
import { Dialog } from "./components/dialog/dialog";
import { Frame } from "./components/frame/frame";
import { Navbar, RecentFrame } from "./components/navbar/navbar";
import { Preferences } from "./components/preferences/preferences";
import { Terminal, TerminalEntry } from "./components/terminal/terminal";
import "./custom-elements";
import { FrameSchema, getAppDB, openAppDB } from "./services/db/db";
import { applyDrafts, applyFrameChanges, getActiveFrame, getDraftFrames, getLocalBaseCommit, getRecentFrames, putDraftFrame, resetDb } from "./services/db/tx";
import { getGitHubContext } from "./services/git/github-context";
import { fetch, getRemoteAll, push, testConnection } from "./services/sync/sync";

import "./styles/index.css";
import { getEvenHub } from "./utils/events";
import { ensure } from "./utils/flow-control";

function main() {
  const url = new URL(location.href);
  if (!url.searchParams.has("frame")) {
    location.search = new URLSearchParams({ frame: "new" }).toString();
    return;
  }

  render(<App />, document.getElementById("app") as HTMLElement);
}

function App() {
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [existingFrame, setExistingFrame] = useState<null | undefined | FrameSchema>(undefined);
  useEffect(() => void loadActiveFrame().then((frame) => setExistingFrame(frame ? frame : null)), []);
  const initialMarkdown = useMemo(() => getInitialMarkdown(existingFrame), [existingFrame]);
  const [recentFrames, setRecentFrames] = useState<RecentFrame[]>([]);
  useEffect(() => void getRecentFramesWrapper().then(setRecentFrames), []);
  const [draftFrames, setDraftFrames] = useState<RecentFrame[]>([]);
  useEffect(() => void getDrafts().then(setDraftFrames), []);

  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);
  const toggleTerminal = useCallback(() => setIsTerminalExpanded((prev) => !prev), []);

  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([]);
  useEffect(() => {
    const terminalEvents = getEvenHub("terminal");
    terminalEvents.addEventListener("stdout", (e) =>
      setTerminalEntries((prev) => [...prev, { key: Date.now(), timestamp: new Date(), content: (e as CustomEvent<string>).detail }])
    );
  }, []);

  useEffect(() => {
    const handleGlobalKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "KeyP") {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if (e.ctrlKey && e.code === "Backquote") {
        e.preventDefault();
        toggleTerminal();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyboard);
  }, []);

  return (
    <>
      <div class="u-flex-cols u-flex__grow">
        <Navbar class="u-flex__fixed" recentFrames={recentFrames} draftFrames={draftFrames} onOpenPreferences={() => setIsPreferencesOpen(true)} />
        <Frame class="u-flex__grow" initialMarkdown={initialMarkdown} onSave={(content) => saveFrame(existingFrame?.id, content)} />
      </div>
      <Terminal entries={terminalEntries} isExpanded={isTerminalExpanded} onToggle={toggleTerminal} />
      <Dialog isOpen={isPreferencesOpen} onClose={() => setIsPreferencesOpen(false)}>
        <Preferences />
      </Dialog>
      <Dialog isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)}>
        <CommandPalette onCommand={handleCommand} />
      </Dialog>
    </>
  );
}

async function loadActiveFrame() {
  const url = new URL(location.href);
  const frameId = url.searchParams.get("frame")!;
  const frame = await getActiveFrame(await getAppDB(), frameId);
  return frame;
}

function getInitialMarkdown(existingFrame: null | undefined | FrameSchema) {
  if (existingFrame) return existingFrame.content;
  else if (existingFrame === null) return "- New frame";
  return;
}

async function getRecentFramesWrapper(): Promise<RecentFrame[]> {
  const db = await getAppDB();
  return (await getRecentFrames(db)).map((frame) => ({
    id: frame.id,
    title: frame.content.slice(2, 24),
  }));
}

async function getDrafts(): Promise<RecentFrame[]> {
  const db = await getAppDB();
  return (await getDraftFrames(db)).map((frame) => ({
    id: frame.id,
    title: frame.content?.slice(2, 24) ?? "(Deleted)",
    status: frame.changeType.toString(),
  }));
}

async function handleCommand(command: string) {
  if (command === "test") {
    await handleTestConnection();
  } else if (command === "fetch") {
    await handleFetch();
  } else if (command === "pull") {
    await handlePull();
  } else if (command === "clone") {
    await handleClone();
  } else if (command === "push") {
    await handlePush();
  } else if (command === "save") {
    getEvenHub("command").dispatchEvent(new CustomEvent("exec", { detail: "save" }));
  }
}

async function saveFrame(existingFrameId: string | undefined, content: string) {
  debugger;
  const id = existingFrameId ?? crypto.randomUUID();
  await putDraftFrame(await getAppDB(), {
    id,
    content,
    dateUpdated: new Date(),
  });

  getEvenHub("terminal").dispatchEvent(new CustomEvent("stdout", { detail: `Save success` }));

  if (!existingFrameId) {
    location.search = new URLSearchParams({ frame: id }).toString();
  }
}

async function handleTestConnection() {
  const context = await getGitHubContext();
  if (!context) return;
  const framesTree = await testConnection(context);
  getEvenHub("terminal").dispatchEvent(new CustomEvent("stdout", { detail: `${framesTree?.length} frames found` }));
}

async function handleClone() {
  const context = ensure(await getGitHubContext());
  const remoteAll = await getRemoteAll(context);
  const db = await openAppDB();
  resetDb(db, remoteAll.frames, remoteAll.sha);
  console.log(`[preference] cloned ${remoteAll.frames.length} items, sha: ${remoteAll.sha}`);

  window.confirm("Reload now?") && location.reload();
}

async function handleFetch() {
  const db = await getAppDB();
  const result = await fetch(ensure(await getGitHubContext()), ensure(await getLocalBaseCommit(db)));
  console.log(result);
  getEvenHub("terminal").dispatchEvent(new CustomEvent("stdout", { detail: result ? `${result?.changes.length} changes found` : `No changes` }));
}

async function handlePull() {
  const db = await getAppDB();
  const result = await fetch(ensure(await getGitHubContext()), ensure(await getLocalBaseCommit(db)));
  console.log(result);
  result && (await applyFrameChanges(db, result.changes, result.headCommit));
  getEvenHub("terminal").dispatchEvent(new CustomEvent("stdout", { detail: result ? `${result?.changes.length} changes found` : `No changes` }));
}

async function handlePush() {
  const db = await getAppDB();
  const drafts = await getDraftFrames(db);
  const pushResult = await push(ensure(await getGitHubContext()), drafts);
  console.log(`[push] pushed`, pushResult);
  if (!pushResult) return;
  await applyDrafts(db, drafts, pushResult.commitSha);
  console.log(`[push] db updated`);
  if (window.confirm("Reload now?")) {
    location.reload();
  }
}

main();
