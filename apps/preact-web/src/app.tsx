import { render } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { CommandPalette } from "./components/command-palette/command-palette";
import { Dialog } from "./components/dialog/dialog";
import { Frame } from "./components/frame/frame";
import { Navbar, RecentFrame } from "./components/navbar/navbar";
import { Preferences } from "./components/preferences/preferences";
import { Terminal, TerminalEntry } from "./components/terminal/terminal";
import "./custom-elements";
import { FrameSchema, getAppDB } from "./services/db/db";
import { getDraftFrames, getFrame, getRecentFrames, putDraftFrame } from "./services/db/tx";

import "./styles/index.css";
import { getEvenHub } from "./utils/events";

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
  const handleSave = useCallback((content: string) => saveFrame(existingFrame?.id, content), [existingFrame]);
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
        <Frame class="u-flex__grow" initialMarkdown={initialMarkdown} onSave={handleSave} />
      </div>
      <Terminal entries={terminalEntries} isExpanded={isTerminalExpanded} onToggle={toggleTerminal} />
      <Dialog isOpen={isPreferencesOpen} onClose={() => setIsPreferencesOpen(false)}>
        <Preferences onTestConnection={handleTestConnection} />
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
  const frame = await getFrame(await getAppDB(), frameId);
  return frame;
}

async function saveFrame(existingFrameId: string | undefined, content: string) {
  const id = existingFrameId ?? crypto.randomUUID();
  await putDraftFrame(await getAppDB(), {
    id,
    content,
    dateUpdated: new Date(),
  });

  location.search = new URLSearchParams({ frame: id }).toString();
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
    handleTestConnection();
  }
}

async function handleTestConnection() {
  const terminalEvents = getEvenHub("terminal");
  terminalEvents.dispatchEvent(new CustomEvent("stdout", { detail: "test message" }));
}

main();
