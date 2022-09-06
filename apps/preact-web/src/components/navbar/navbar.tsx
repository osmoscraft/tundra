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
          <button onClick={props.onOpenPreferences}>Preferences</button>
        </li>
      </menu>
      <ul>
        <li>
          <a href={`?frame=new`}> [+] New frame</a>
        </li>
        {recentFrames.map((frame) => (
          <li key={frame.id}>
            <a href={`?frame=${frame.id}`}>
              [{frame.status}] {frame.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface RecentFrame {
  id: string;
  title: string;
  status: number;
}

// TODO send data from root
async function getRecentFrames(): Promise<RecentFrame[]> {
  const db = await getAppDB();
  return getRecentFramesTx(db, (dbFrame, localChangeItem) => ({
    id: dbFrame.id,
    title: dbFrame.content.slice(2, 24),
    status: localChangeItem?.changeType ?? 0,
  }));
}
