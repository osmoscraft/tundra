/** Create a `<template>` element from a string of HTML. */
export const template = (html: string) => {
  const t = document.createElement("template");
  t.innerHTML = html;
  return t;
};

/** Attach the content of a `<template>` element to a shadow root. */
export const attachShadowTemplate = (template: HTMLTemplateElement, target: Element) => {
  const shadow = target.attachShadow({ mode: "open" });
  shadow.appendChild(template.content.cloneNode(true));
  return shadow;
};

/** Attach the HTML string to a shadow root. */
export const attachShadowHtml = (html: string, target: Element) => {
  const shadow = target.attachShadow({ mode: "open" });
  shadow.appendChild(template(html).content.cloneNode(true));

  return shadow;
};
