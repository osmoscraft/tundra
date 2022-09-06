export interface NavbarProps {
  onOpenPreferences: () => any;
}
export function Navbar(props: NavbarProps) {
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
      <ul id="recent-list"></ul>
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
