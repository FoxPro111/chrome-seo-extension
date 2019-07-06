function onWindowLoad() {
  var code =
    "var meta = document.querySelector(\"meta[name='description']\");" +
    'if (meta) meta = meta.getAttribute("content");' +
    "var images = document.querySelectorAll('img');" +
    "console.log(images);" +
    "images = Array.prototype.map.call(images, function(image) {" +
    "  return {" +
    "      currentSrc: image.currentSrc," +
    "      src: image.src," +
    "      height: image.height," +
    "      width: image.width," +
    "      alt: image.alt" +
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

      if (result.title) {
        var title = document.querySelector("#title");
        title.innerHTML = result.title;
      }

      if (result.description) {
        var description = document.querySelector("#description");
        description.innerHTML = result.description;
      }

      if (result.location) {
        var url = document.querySelector("#url");
        url.innerHTML = result.location;
      }

      if (result.images) {
        var imagesDOM = document.querySelector(".popup__images");
        var imagesOutput = '<div class="popup__images-list">';

        var images = result.images.slice("");

        var filteredImages = images
          .filter(function(img) {
            return img.width > 320;
          })
          .sort(function(imgA, imgB) {
            return imgA.width - imgB.width;
          });

        filteredImages.forEach(function(image, index) {
          var imgClass = index === 0 ? " is-active" : "";

          console.log(image.src.trim());

          imagesOutput += '<div class="popup__images-item">';
          imagesOutput += '<div class="js-image popup__image' + imgClass + '">';
          imagesOutput += '<img src="' + image.src + '" />';
          imagesOutput += image.alt.trim()
            ? '<span class="popup__image-alt">' + image.alt + "</span>"
            : "";
          imagesOutput += "</div>";
          imagesOutput += "</div>";
        });

        imagesOutput += "</div>";

        imagesDOM.innerHTML = imagesOutput;

        var jsImages = document.getElementsByClassName("js-image");
        Array.prototype.forEach.call(jsImages, function(image) {
          image.addEventListener("click", changeActiveImage);
        });
      }

      console.log(result);
    }
  );
}

window.onload = onWindowLoad;

// for focus elements

var labels = document.getElementsByClassName("js-label");

Array.prototype.forEach.call(labels, function(label) {
  label.addEventListener("click", function() {
    var targetID = this.getAttribute("for");

    placeCaretAtEnd(document.getElementById(targetID));
  });
});

function placeCaretAtEnd(el) {
  el.focus();
  if (
    typeof window.getSelection != "undefined" &&
    typeof document.createRange != "undefined"
  ) {
    var range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } else if (typeof document.body.createTextRange != "undefined") {
    var textRange = document.body.createTextRange();
    textRange.moveToElementText(el);
    textRange.collapse(false);
    textRange.select();
  }
}

function changeActiveImage() {
  var jsImages = document.getElementsByClassName("js-image");

  Array.prototype.forEach.call(jsImages, function(image) {
    image.classList.remove("is-active");
  });

  this.classList.add("is-active");
}
