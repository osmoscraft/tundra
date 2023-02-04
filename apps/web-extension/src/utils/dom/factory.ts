import { compose } from "../fp/compose";

export const templateFromHtml = (html: string) => {
  const t = element("template");
  t.innerHTML = html;
  return t;
};

export const templateById = (id: string) => {
  return document.getElementById(id) as HTMLTemplateElement;
};

export const element: typeof document.createElement = (...args: Parameters<typeof document.createElement>) => {
  return document.createElement(...args);
};

export const attachShadowTemplate = (template: HTMLTemplateElement, target: Element) => {
  const shadow = target.attachShadow({ mode: "open" });
  shadow.appendChild(cloneTemplateContent(template));
  return shadow;
};

export const cloneTemplateContent = (template: HTMLTemplateElement) => {
  return template.content.cloneNode(true) as DocumentFragment;
};

export const attachHtml = (html: string, target: Element) => attachShadowTemplate(templateFromHtml(html), target);
export const fragmentFromHtml = compose(cloneTemplateContent, templateFromHtml);
export const attachTemplateById = (id: string, target: Element) => attachShadowTemplate(templateById(id), target);
