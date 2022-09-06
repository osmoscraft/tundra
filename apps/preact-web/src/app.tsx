import { render } from "preact";
import { useState } from "preact/hooks";
import { Dialog } from "./components/dialog/dialog";
import { Navbar } from "./components/navbar/navbar";
import { Preferences } from "./components/preferences/preferences";
import "./styles/index.css";

function App() {
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  console.log(isPreferencesOpen);

  return (
    <>
      <Navbar onOpenPreferences={() => setIsPreferencesOpen(true)} />
      <Dialog isOpen={isPreferencesOpen} onClose={() => setIsPreferencesOpen(false)}>
        <Preferences />
      </Dialog>
    </>
  );
}

render(<App />, document.getElementById("app") as HTMLElement);
