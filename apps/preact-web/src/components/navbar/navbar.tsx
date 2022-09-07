import "./navbar.css";

export interface NavbarProps {
  class?: string;
  onOpenPreferences: () => any;
  recentFrames: RecentFrame[];
  draftFrames: RecentFrame[];
}

export interface RecentFrame {
  id: string;
  title: string;
  status?: string;
}

export function Navbar(props: NavbarProps) {
  return (
    <div class={`${props.class ?? ""} c-navbar`}>
      <menu>
        <li>
          <button onClick={props.onOpenPreferences}>Preferences</button>
        </li>
      </menu>
      <a href={`?frame=new`}> [+] New frame</a>
      <div>Changes</div>
      <ul>
        {props.draftFrames.map((frame) => (
          <li key={frame.id}>
            <a href={`?frame=${frame.id}`}>
              [{frame.status}] {frame.title}
            </a>
          </li>
        ))}
      </ul>
      <hr />
      <div>Recent</div>
      <ul>
        {props.recentFrames.map((frame) => (
          <li key={frame.id}>
            <a href={`?frame=${frame.id}`}>{frame.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
