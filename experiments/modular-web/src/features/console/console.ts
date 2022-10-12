export function log(outputElement: HTMLOutputElement, message: string) {
  const item = document.createElement("div");
  item.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

  outputElement.append(item);
}
