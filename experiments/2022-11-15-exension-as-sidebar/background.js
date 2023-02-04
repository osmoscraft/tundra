chrome.action.onClicked.addListener(async (tab) => {
  chrome.action.getPopup();
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: toggleSideBar,
  });
});

function toggleSideBar() {
  if (!window._lens_injected) {
    window._lens_injected = true;

    const link = document.createElement("link");
    link.href = chrome.runtime.getURL("sidebar/bundle.css");
    link.rel = "stylesheet";
    document.head.append(link);

    const script = document.createElement("script");
    script.type = "module";
    script.src = chrome.runtime.getURL("sidebar/bundle.js");
    document.body.appendChild(script);
  }

  // Should toggle
  const existingElement = document.querySelector("lens-sidebar-element");
  if (existingElement) {
    existingElement.remove();
  } else {
    const sidebar = document.createElement("lens-sidebar-element");
    sidebar.hidden = true;
    document.body.prepend(sidebar);
  }
}
