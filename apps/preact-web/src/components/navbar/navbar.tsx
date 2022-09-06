import { useEffect, useState } from "preact/hooks";
import { getAppDB } from "../../services/db/db";
import { getRecentFramesTx } from "../../services/db/tx";

export interface NavbarProps {
  onOpenPreferences: () => any;
}
export function Navbar(props: NavbarProps) {
  const [recentFrames, setRecentFrames] = useState<RecentFrame[]>([]);
  useEffect(() => void getRecentFrames().then(setRecentFrames), []);

  return (
    <div class="c-navbar">
      <menu>
        <li>
          <button data-command="createFrame">New</button>
        </li>
        <li>
          <button data-command="syncAll">Sync</button>
        </li>
        <li>
          <button data-command="pullAll">Pull</button>
        </li>
        <li>
          <button data-command="pushAll">Push</button>
        </li>
      </menu>
      <ul>
        {recentFrames.map((frame) => (
          <li key={frame.id}>
            {frame.status}
            {frame.title}
          </li>
        ))}
      </ul>
      <menu>
        <li>
          <button data-command="openSearch">Search</button>
        </li>
        <li>
          <button onClick={props.onOpenPreferences}>Preferences</button>
        </li>
      </menu>
    </div>
  );
}

interface RecentFrame {
  id: string;
  title: string;
  status: number;
}
async function getRecentFrames(): Promise<RecentFrame[]> {
  const db = await getAppDB();
  return getRecentFramesTx(db, (dbFrame, localChangeItem) => ({
    id: dbFrame.id,
    title: dbFrame.content.slice(64),
    status: localChangeItem?.changeType ?? 0,
  }));
}
