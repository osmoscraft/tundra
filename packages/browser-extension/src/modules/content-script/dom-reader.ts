async function main() {
  console.log("hello from content script");
  const fullHtml = document.documentElement.outerHTML;
  return fullHtml;
}

export default main;
