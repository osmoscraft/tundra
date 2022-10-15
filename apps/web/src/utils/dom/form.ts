import { curry } from "../functional/curry";

export const formData = (formElement: HTMLFormElement) => new FormData(formElement);

export const reset = (formElement: HTMLFormElement) => {
  formElement.reset();
  return formElement;
};

export const getFormField = curry((name: string, formData: FormData) => formData.get(name));
