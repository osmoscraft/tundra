import { closest } from "./dom";

export function getFormField(name: string, data: FormData) {
  return data.get(name);
}

export function formData(element: HTMLFormElement) {
  return new FormData(element);
}

export function closestForm(element: Element) {
  return closest<HTMLFormElement>("form", element);
}

export function resetForm(form: HTMLFormElement) {
  form.reset();
  return form;
}
