export function loadTemplate(html: string) {
  const templateElement = document.createElement("template");
  templateElement.innerHTML = html;

  const clonedTemplate = templateElement.content.cloneNode(true) as DocumentFragment;
  templateElement.remove();

  return clonedTemplate;
}
