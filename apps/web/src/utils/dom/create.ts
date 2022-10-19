export const templateFromHtml = (html: string) => {
  const t = h("template");
  t.innerHTML = html;
  return t;
};

export const h: typeof document.createElement = (...args: Parameters<typeof document.createElement>) => {
  return document.createElement(...args);
};

export const shadowFromTemplate = (template: HTMLTemplateElement, target: Element) => {
  const shadow = target.attachShadow({ mode: "open" });
  shadow.appendChild(cloneTemplateContent(template));
};

export const cloneTemplateContent = (template: HTMLTemplateElement) => {
  return template.content.cloneNode(true) as DocumentFragment;
};

export const shadowFromHtml = (html: string, target: Element) => shadowFromTemplate(templateFromHtml(html), target);
export const fragmentFromHtml = (html: string) => cloneTemplateContent(templateFromHtml(html));
