chrome.runtime.onConnect.addListener(function (port) {
  console.assert(port.name === "background");
  port.onMessage.addListener(function (msg) {
    console.log(msg);
  });
});

// Pending: https://github.com/GoogleChrome/developer.chrome.com/issues/2602
// Ideally we want to open popup and inject content script both from service worker
// chrome.action.onClicked.addListener(async (tab) => {
//   chrome.action.openPopup();
// });
