chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    message.innerText = request.source;
  }
});

function onWindowLoad() {
  var message = document.querySelector("#message");

  const images = [];

  var code =
    "var meta = document.querySelector(\"meta[name='description']\");" +
    'if (meta) meta = meta.getAttribute("content");' +
    "var images = document.querySelectorAll('img');" +
    "console.log(images);" +
    "images = Array.prototype.map.call(images, function(image) {" +
    "  return {" +
    "   baseURI: image.baseURI," +
    "      currentSrc: image.currentSrc," +
    "     height: image.clientHeight," +
    "      width: image.clientWidth" +
    "    };" +
    "  });" +
    "console.log(images);" +
    "({" +
    "    title: document.title," +
    "    description: meta || ''," +
    "    location: window.location.href," +
    "    images: images" +
    "});";
  chrome.tabs.executeScript(
    {
      code: code
    },
    function(results) {
      if (!results) {
        // An error occurred at executing the script. You've probably not got
        // the permission to execute a content script for the current tab
        return;
      }
      var result = results[0];

      console.log(result);
    }
  );
}

window.onload = onWindowLoad;
