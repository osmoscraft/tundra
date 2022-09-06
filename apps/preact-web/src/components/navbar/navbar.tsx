import "./navbar.css";

export interface NavbarProps {
  class?: string;
  onOpenPreferences: () => any;
  recentFrames: RecentFrame[];
}

export interface RecentFrame {
  id: string;
  title: string;
  status: number;
}

export function Navbar(props: NavbarProps) {
  return (
    <div class={`${props.class ?? ""} c-navbar`}>
      <menu>
        <li>
          <button onClick={props.onOpenPreferences}>Preferences</button>
        </li>
      </menu>
      <ul>
        <li>
          <a href={`?frame=new`}> [+] New frame</a>
        </li>
        {props.recentFrames.map((frame) => (
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
