import { useEffect, useRef } from "preact/hooks";
import "./dialog.css";

export interface DialogProps {
  isOpen: boolean;
  children: JSX.Element;
  onClose: () => any;
}
export function Dialog(props: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.addEventListener("close", props.onClose);
    return () => dialogRef.current?.removeEventListener("close", props.onClose);
  }, [props.onClose]);

  useEffect(() => {
    if (props.isOpen) {
      dialogRef.current?.showModal();
    }
  }, [props.isOpen]);

  return props.isOpen ? (
    <dialog ref={dialogRef} class="c-dialog">
      {props.children}
    </dialog>
  ) : null;
}
