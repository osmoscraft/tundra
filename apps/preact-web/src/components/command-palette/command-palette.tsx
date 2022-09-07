import { useCallback } from "preact/hooks";

export interface CommandPaletteProps {
  onCommand: (command: string) => any;
}
export function CommandPalette(props: CommandPaletteProps) {
  const handleSubmit = useCallback((e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const command = formData.get("command") as string;

    props.onCommand(command);
    form.reset();
  }, []);
  return (
    <form onSubmit={handleSubmit}>
      <input name="command" type="text" autoComplete="off" list="commands" />
      <datalist id="commands">
        <option value="pull" />
        <option value="push" />
        <option value="sync" />
        <option value="test" />
      </datalist>
    </form>
  );
}
