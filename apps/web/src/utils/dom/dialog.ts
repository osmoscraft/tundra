export function toggleDialog(dialogElement: HTMLDialogElement, isOpen?: boolean) {
  dialogElement.open = isOpen === undefined ? !dialogElement.open : isOpen;
  return dialogElement;
}
