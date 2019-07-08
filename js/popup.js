/*********************/
/***** CONSTANTS *****/
/*********************/
const STORAGE = chrome.storage.sync;
const TITLE = document.getElementById("title");
const DESCRIPTION = document.getElementById("description");
const URL = document.getElementById("url");
const SEND_BUTTON = document.querySelector(".js-send");
const ADD_PROFILE = document.querySelector(".js-add-profile");
const CLEAR_BUTTON = document.querySelector(".js-clear");
const IMAGES_MIN_WIDTH = 320;

const INPUT_NAME = document.getElementById("input-profile");
const INPUT_KEY = document.getElementById("input-key");
const INPUT_SECRET = document.getElementById("input-secret");

const TAB_LINKS = document.getElementsByClassName("popup__tab__link");
const TAB_WRAPS = document.getElementsByClassName("popup__wrap");

/********************************/
/***** GET PAGE INFORMATION *****/
/********************************/
function getPageInformation() {
  var code =
    "var meta = document.querySelector(\"meta[name='description']\");" +
    'if (meta) meta = meta.getAttribute("content");' +
    "var images = document.querySelectorAll('img');" +
    "images = Array.prototype.map.call(images, function(image) {" +
    "  return {" +
    "      currentSrc: image.currentSrc," +
    "      src: image.src," +
    "      height: image.height," +
    "      width: image.width," +
    "      alt: image.alt" +
    "    };" +
    "  });" +
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

      renderPageInformation(results[0]);
    }
  );
}

/***********************************/
/***** RENDER PAGE INFORMATION *****/
/***********************************/
function renderPageInformation(result) {
  if (result.title) {
    TITLE.innerHTML = result.title;
  }

  if (result.description) {
    DESCRIPTION.innerHTML = result.description;
  }

  if (result.location) {
    URL.innerHTML = result.location;
  }

  if (result.images) {
    renderImages(result.images);
  }
}

/******************************/
/***** RENDER PAGE IMAGES *****/
/******************************/
function renderImages(images) {
  var imagesDOM = document.querySelector(".popup__images");
  var imagesOutput = '<div class="popup__images-list">';

  var filteredImages = images
    .filter(function(img) {
      return img.width > IMAGES_MIN_WIDTH;
    })
    .sort(function(imgA, imgB) {
      return imgA.width - imgB.width;
    });

  filteredImages.forEach(function(image, index) {
    var imgClass = index === 0 ? " is-active" : "";

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
    image.addEventListener("click", changeActiveImageHandler);
  });
}

/********************************/
/***** CHANGE ACTIVE IMAGES *****/
/********************************/
function changeActiveImageHandler() {
  var jsImages = document.getElementsByClassName("js-image");

  Array.prototype.forEach.call(jsImages, function(image) {
    image.classList.remove("is-active");
  });

  this.classList.add("is-active");
}

/*******************************/
/***** SEND NOTIFY HANDLER *****/
/*******************************/
function sendNotificationHandler(key, secret, title, content, img, link) {
  var data = JSON.stringify({
    payload: {
      message: content,
      title: title,
      icon: img,
      redirect_url: link
    }
  });

  var promise = fetch("https://uapi.gravitec.net/api/v3/push", {
    method: "POST",
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + key + ":" + secret,
      "Access-Control-Allow-Credentials": true,
      "Cache-Control": "no-cache"
    },
    body: data
  });

  promise
    .then(response => {
      console.log(response);
    })
    .catch(err => {
      console.log(err);
    });
}

/*************************/
/***** INIT PROFILES *****/
/*************************/
function initProfiles() {
  STORAGE.get(["profiles"], function(result) {
    var profiles = [];
    var selectOutput = "";
    var profilesOutput = "";
    var selectWrap = document.querySelector(".popup__select__wrap");
    var profilesWrap = document.querySelector(".profiles");

    if (typeof result.profiles === "undefined" || !result.profiles.length) {
      selectOutput = profilesOutput = "Please, add some profile";

      selectWrap.innerHTML = selectOutput;
      profilesWrap.innerHTML = profilesOutput;

      SEND_BUTTON.setAttribute("disabled", "disabled");

      return;
    }

    SEND_BUTTON.removeAttribute("disabled");

    profiles = [...result.profiles];
    selectOutput +=
      '<select name="profile-select" id="profile-select" class="popup__value">';
    profilesOutput += '<div class="profiles__list">';

    profiles.forEach(function(profile) {
      selectOutput +=
        "<option value=" + profile.id + ">" + profile.name + "</option>";

      profilesOutput += `<div class="profiles__item">
                            <div class="profiles__header">${profile.name}
                            <a href="#" class="js-profile-delete profiles__delete" data-id="${
                              profile.id
                            }">X</a>
                            <a href="#" class="js-profile-edit profiles__edit"></a>
                            </div>
                            <div class="profiles__content">
                              <div class="profiles__content-inner">
                                <div class="profiles__fields">
                                  <label>Profile name:</label>
                                  <div class="popup__value js-update-name" contenteditable="true">${
                                    profile.name
                                  }</div>
                                </div>
                                <div class="profiles__fields">
                                  <label>App key:</label>
                                  <div class="popup__value js-update-key" contenteditable="true">${
                                    profile.key
                                  }</div>
                                </div>
                                <div class="profiles__fields">
                                  <label>App secret:</label>
                                  <div class="popup__value js-update-secret" contenteditable="true">${
                                    profile.secret
                                  }</div>
                                </div>
                                <a href="#" class="profiles__update js-profile-update" data-id="${
                                  profile.id
                                }">Update</a>
                              </div>
                            </div>
                          </div>`;
    });

    selectOutput += "</select>";
    profilesOutput += "</div>";

    selectWrap.innerHTML = selectOutput;
    profilesWrap.innerHTML = profilesOutput;

    var editHeader = document.getElementsByClassName("js-profile-edit");
    Array.prototype.forEach.call(editHeader, function(btn) {
      btn.addEventListener("click", accordionToggle);
    });

    var deleteButtons = document.getElementsByClassName("js-profile-delete");
    Array.prototype.forEach.call(deleteButtons, function(btn) {
      btn.addEventListener("click", profileDeleteHandler);
    });

    var updateButtons = document.getElementsByClassName("js-profile-update");
    Array.prototype.forEach.call(updateButtons, function(btn) {
      btn.addEventListener("click", profileUpdateHandler);
    });
  });
}

/*****************************/
/***** ACCORDION HANDLER *****/
/*****************************/
function accordionToggle(event) {
  event.preventDefault();

  var content = this.parentNode.parentNode.querySelector(".profiles__content");

  var allContent = document.getElementsByClassName("profiles__content");
  Array.prototype.forEach.call(allContent, function(content) {
    content.style.display = "none";
  });

  content.style.display = "block";
}

/**********************************/
/***** PROFILE DELETE HANDLER *****/
/**********************************/
function profileDeleteHandler(event) {
  event.preventDefault();

  var id = +this.getAttribute("data-id");

  STORAGE.get(["profiles"], function(result) {
    var profiles = [...result.profiles];

    profiles = profiles.filter(profile => {
      return profile.id !== id;
    });

    STORAGE.set({ profiles: profiles });

    initProfiles();
  });
}

/**********************************/
/***** PROFILE UPDATE HANDLER *****/
/**********************************/
function profileUpdateHandler(event) {
  event.preventDefault();

  var wrap = this.parentNode;
  var id = +this.getAttribute("data-id");
  var name = wrap.querySelector(".js-update-name").innerHTML;
  var key = wrap.querySelector(".js-update-key").innerHTML;
  var secret = wrap.querySelector(".js-update-secret").innerHTML;

  STORAGE.get(["profiles"], function(result) {
    var profiles = [...result.profiles];

    profiles = profiles.map(profile => {
      if (profile.id !== id) {
        return profile;
      } else {
        return {
          ...profile,
          name: name,
          secret: secret,
          key: key
        };
      }
    });

    console.log(profiles);

    STORAGE.set({ profiles: profiles });

    initProfiles();
  });
}

/*******************************/
/***** TAB CHANGE LISTENER *****/
/*******************************/
Array.prototype.forEach.call(TAB_LINKS, function(tab) {
  tab.addEventListener("click", function(event) {
    event.preventDefault();

    var target = this.getAttribute("data-tab");

    Array.prototype.forEach.call(TAB_LINKS, function(image) {
      image.parentNode.classList.remove("is-active");
    });

    Array.prototype.forEach.call(TAB_WRAPS, function(image) {
      image.classList.remove("is-active");
    });

    document.getElementById(target).classList.add("is-active");
    this.parentNode.classList.add("is-active");
  });
});

/*******************************/
/***** SEND BUTTON HANDLER *****/
/*******************************/
SEND_BUTTON.addEventListener("click", function(event) {
  event.preventDefault();

  var title = TITLE.textContent;
  var description = DESCRIPTION.textContent;
  var url = URL.textContent;
  var APP_KEY = "";
  var APP_SECRET = "";
  var image = "";

  var select = document.getElementById("profile-select");
  var imageEl = document.querySelector(".popup__image.is-active img");

  if (imageEl) {
    image = imageEl.src;
  }

  STORAGE.get(["profiles"], function(result) {
    var profiles = [...result.profiles];

    var profile = profiles.find(function(element) {
      return element.id === +select.value;
    });

    APP_KEY = profile.key;
    APP_SECRET = profile.secret;

    sendNotificationHandler(
      APP_KEY,
      APP_SECRET,
      title,
      description,
      image,
      url
    );
  });
});

/***********************************/
/***** ADD NEW PROFILE HANDLER *****/
/***********************************/
ADD_PROFILE.addEventListener("click", function(e) {
  e.preventDefault();

  const name = INPUT_NAME.innerHTML;
  const key = INPUT_KEY.innerHTML;
  const secret = INPUT_SECRET.innerHTML;

  INPUT_NAME.classList.remove("not-valid");
  INPUT_KEY.classList.remove("not-valid");
  INPUT_SECRET.classList.remove("not-valid");

  if (name.trim() === "") {
    INPUT_NAME.classList.add("not-valid");

    return;
  }

  if (key.trim() === "") {
    INPUT_KEY.classList.add("not-valid");

    return;
  }

  if (secret.trim() === "") {
    INPUT_SECRET.classList.add("not-valid");

    return;
  }

  INPUT_NAME.innerHTML = INPUT_KEY.innerHTML = INPUT_SECRET.innerHTML = "";

  STORAGE.get(["profiles"], function(result) {
    var profiles = [];
    if (typeof result.profiles !== "undefined") {
      profiles = [...result.profiles];
    }

    profiles.push({
      name,
      key,
      secret,
      id: Math.floor(Math.random() * 100000)
    });

    STORAGE.set({ profiles: profiles });
    initProfiles();
  });
});

/******************************/
/***** CLEAR ALL SETTiNGS *****/
/******************************/
CLEAR_BUTTON.addEventListener("click", function(event) {
  event.preventDefault();

  STORAGE.clear();

  initProfiles();
});

/*****************************/
/***** INIT PAGE ON LOAD *****/
/*****************************/
(function() {
  getPageInformation();
  initProfiles();
})();
