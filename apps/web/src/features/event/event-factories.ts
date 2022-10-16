/**
 * Event dispatched from any modal element when user intends to exit the modal area.
 * preventDefault should cancel the exit
 */
export const exitModalEvent = () => new Event("ui.modal.exit", { bubbles: true });
