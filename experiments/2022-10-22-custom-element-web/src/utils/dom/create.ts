export const templateFromHtml = (html: string) => {
  const t = h("template");
  t.innerHTML = html;
  return t;
};

export const h: typeof document.createElement = (...args: Parameters<typeof document.createElement>) => {
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

export const attachShadowHtml = (html: string, target: Element) => attachShadowTemplate(templateFromHtml(html), target);
export const fragmentFromHtml = (html: string) => cloneTemplateContent(templateFromHtml(html));
