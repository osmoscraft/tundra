import { render } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { Dialog } from "./components/dialog/dialog";
import { Frame } from "./components/frame/frame";
import { Navbar, RecentFrame } from "./components/navbar/navbar";
import { Preferences } from "./components/preferences/preferences";
import "./custom-elements";
import { FrameSchema, getAppDB } from "./services/db/db";
import { getFrame, getRecentFrames, putChangedFrame } from "./services/db/tx";

import "./styles/index.css";

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

  useEffect(() => {
    const handleGlobalKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "KeyP") {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyboard);
  }, []);

  return (
    <>
      <Navbar class="u-flex__fixed" recentFrames={recentFrames} onOpenPreferences={() => setIsPreferencesOpen(true)} />
      <Frame class="u-flex__grow" initialMarkdown={initialMarkdown} onSave={handleSave} />
      <Dialog isOpen={isPreferencesOpen} onClose={() => setIsPreferencesOpen(false)}>
        <Preferences />
      </Dialog>
      <Dialog isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)}>
        <input type="text" autoComplete="off" />
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
  await putChangedFrame(await getAppDB(), {
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
  return getRecentFrames(db, (dbFrame, localChangeItem) => ({
    id: dbFrame.id,
    title: dbFrame.content.slice(2, 24),
    status: localChangeItem?.changeType ?? 0,
  }));
}

main();
