export const template = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template;
};

export const cloneTemplate = (template: HTMLTemplateElement) => template.content.cloneNode(true) as DocumentFragment;
