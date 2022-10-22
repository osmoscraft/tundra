export const templateFromHtml = (html) => {
  const t = h("template");
  t.innerHTML = html;
  return t;
};

export const h = (/** @type {Parameters<typeof document.createElement>} */ ...tag) => document.createElement(...tag);

export const attachShadowHtml = (html, target) => attachShadowTemplate(templateFromHtml(html), target);
export const fragmentFromHtml = (html) => cloneTemplateContent(templateFromHtml(html));

export const attachShadowTemplate = (template, target) => {
  const shadow = target.attachShadow({ mode: "open" });
  shadow.appendChild(cloneTemplateContent(template));
  return shadow;
};

export const cloneTemplateContent = (template) => template.content.cloneNode(true);
