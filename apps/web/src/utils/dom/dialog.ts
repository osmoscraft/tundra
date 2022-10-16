const toggleDialogInternal = (dialogElement: HTMLDialogElement, isOpen?: boolean) => {
  dialogElement.open = isOpen === undefined ? !dialogElement.open : isOpen;
  return dialogElement;
};

export const showDialog = (dialogElement: HTMLDialogElement) => toggleDialogInternal.bind(null, dialogElement, true);
export const hideDialog = (dialogElement: HTMLDialogElement) => toggleDialogInternal.bind(null, dialogElement, false);
