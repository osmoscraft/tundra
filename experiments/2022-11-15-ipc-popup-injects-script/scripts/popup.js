console.log("hello from popup");

Promise.resolve()
  .then(() => console.log(performance.mark("start")))
  .then(() => chrome.tabs.query({ active: true, currentWindow: true }))
  .then(([activeTab]) =>
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: requestDom,
    })
  )
  .then(([injectionResult]) => {
    console.log("received", injectionResult.result);
    console.log("ms passed", performance.measure("duration", "start").duration);
  });

function requestDom() {
  console.log(document.documentElement.innerHTML);
  return document.documentElement.innerHTML;
}

const port = chrome.runtime.connect({ name: "background" });
port.postMessage({ joke: "Knock knock" });
port.onMessage.addListener(function (msg) {
  if (msg.question === "Who's there?") port.postMessage({ answer: "Madame" });
  else if (msg.question === "Madame who?") port.postMessage({ answer: "Madame... Bovary" });
});
