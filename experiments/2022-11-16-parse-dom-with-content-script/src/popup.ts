import { getActiveTab } from "./modules/browser";

async function main() {
  const onLinks = (links: { href: string; text: string }[]) => {
    const listItems = links
      .map((link) => Object.assign(document.createElement("a"), link))
      .map((anchor) => {
        const li = document.createElement("li");
        li.append(anchor);
        return li;
      });
    document.querySelector<Element>("#links")!.innerHTML = "";
    document.querySelector<Element>("#links")!.append(...listItems);
  };

  const activeTab = await getActiveTab();

  chrome.scripting.executeScript(
    {
      target: {
        tabId: activeTab[0].id!,
      },
      files: ["./content.js"],
    },
    ([injectionResult]) => {
      onLinks(injectionResult.result as any);
    }
  );
}

main();
