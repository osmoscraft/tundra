export const template = (html: string) => {
  const t = document.createElement("template");
  t.innerHTML = html;
  return t;
};

export const attachShadowTemplate = (template: HTMLTemplateElement, target: Element) => {
  const shadow = target.attachShadow({ mode: "open" });
  shadow.appendChild(template.content.cloneNode(true));
  return shadow;
};

export const attachShadowHtml = (html: string, target: Element) => {
  const shadow = target.attachShadow({ mode: "open" });
  shadow.appendChild(template(html).content.cloneNode(true));

  return shadow;
};
