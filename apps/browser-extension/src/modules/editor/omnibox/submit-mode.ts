export enum SubmitMode {
  None = 0,
  primary = 1,
  secondary = 2,
  tertiary = 3,
}

export function getEventMode(event: KeyboardEvent | MouseEvent) {
  if (event.ctrlKey) {
    if (event.shiftKey) {
      return SubmitMode.tertiary;
    } else {
      return SubmitMode.secondary;
    }
  } else {
    return SubmitMode.primary;
  }
}
