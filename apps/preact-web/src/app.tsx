import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Dialog } from "./components/dialog/dialog";
import { Frame } from "./components/frame/frame";
import { Navbar } from "./components/navbar/navbar";
import { Preferences } from "./components/preferences/preferences";
import "./custom-elements";
import { getAppDB } from "./services/db/db";
import { getFrameById } from "./services/db/tx";

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
  const [initialFrameContent, setInitialFrameContent] = useState<string | undefined>(undefined);

  useEffect(() => void loadActiveFrame().then((frame) => setInitialFrameContent(frame ? frame.content : "- New frame")), []);

  return (
    <>
      <Navbar onOpenPreferences={() => setIsPreferencesOpen(true)} />
      <Frame initialMarkdown={initialFrameContent} onSave={() => {}} />
      <Dialog isOpen={isPreferencesOpen} onClose={() => setIsPreferencesOpen(false)}>
        <Preferences />
      </Dialog>
    </>
  );
}

async function loadActiveFrame() {
  const url = new URL(location.href);
  const frameId = url.searchParams.get("frame")!;
  const frame = await getFrameById(await getAppDB(), frameId);
  return frame;
}

main();
