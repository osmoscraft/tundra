export enum MenuActionMode {
  None = 0,
  primary = 1,
  secondary = 2,
  tertiary = 3,
}

export function getMenuActionMode(event: KeyboardEvent | MouseEvent) {
  if (event.ctrlKey) {
    if (event.shiftKey) {
      return MenuActionMode.tertiary;
    } else {
      return MenuActionMode.secondary;
    }
  } else {
    return MenuActionMode.primary;
  }
}
