import { GetLinks } from "./messages";
import { sendTypedRequest } from "./modules/typed-message";

async function main() {
  const getActiveTab = () => chrome.tabs.query({ active: true, currentWindow: true });
  const sendMessage = chrome.runtime.sendMessage.bind(chrome.runtime);

  const onLinks = (links: { href: string; text: string }[]) => {
    console.log("recv links", links);
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

  Promise.resolve()
    .then(getActiveTab)
    .then(([activeTab]) => sendTypedRequest<GetLinks>(sendMessage, "GET_LINKS", { url: activeTab.url! }))
    .then(onLinks);
}

main();
