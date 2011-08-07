// msie - attachEvent
// others - addEventListener(event, function, false) // false for bubbling

var Intercept = (function () {
  var
    _ = function (id) {

      return document.getElementById(id);
    },

    api = {},
    
    browserEvents = {
      add: (typeof attachEvent !== "undefined") ? "attachEvent" : "addEventListener",
      rem: (typeof detachEvent !== "undefined") ? "detachEvent" : "removeEventListener"
    },

    config = {},
    
    dropEvent = (function (handler) {
      var
        on = handler === "detachEvent" ? "on" : "";

      return function (element, eventType, fn) {
        element[handler](on + eventType, fn, false);
      };
    }(browserEvents.rem)),

    findChild = function (parent, child) {
      var
        indx = 0,
        nodes = parent.childNodes,
        regex = new RegExp(child, "i");

      while (!regex.test(nodes[indx].nodeName) && indx++ < nodes.length) {}

      return nodes[indx];
    },
    
    localLinks = function (e) {
      e = normalizeEvent(e);

      // for some reason IE adds a port number to the end of host
      if (e.target.href !== "" && window.location.host === e.target.host.replace(/:.*/, "")) {
        e.preventDefault ? e.preventDefault() : (e.returnValue = false);
        e.target.blur();
        if (pageCache[e.target.href]) {
          api.transition(e.target.href);
          return;
        }
        api.request({
          complete: (function (href) {
            return function (xhr) {
              api.cache(href, xhr.responseText);
              api.transition(href);
            };
          }(e.target.href)),
          url: e.target.href
        });
      }
    },
    
    normalizeEvent = function (e) {
      // IE doesn't pass the event to the function grab it from the window object
      e = e || window.event;
      var
        parts = [
          "hash",
          "host",
          "hostname",
          "href",
          "pathname",
          // "port", // Safari doesn't like working with port this way...?
          "protocol",
          "search",
          "target",
          "text"
        ];
      
      // Safari & IE support srcElement
      e.target = e.srcElement || (e.target.nodeType == 3 ? e.target.parentNode : e.target);

      // make sure href is a valid attribute to prevent errors
      // dont forget pathname, host, hostname, ...
      while (parts.length) {
        e.target[parts[0]] = (e.srcElement || e.target)[parts[0]] || "";
        parts.shift();
      }
      
      return e;
    },

    pageCache = {},
    
    trapEvent = (function (handler) {
      var
        on = handler === "attachEvent" ? "on" : "";

      return function (element, eventType, fn) {
        element[handler](on + eventType, fn, false);
      };
    }(browserEvents.add));
    
  api.cache = function (key, obj) {
    if (obj) {
      pageCache[key] = obj;
    }
    return pageCache[key];
  };

  api.config = function (userConfig) {
    config = userConfig;
    api.cache(window.location.href, findChild(_(config.wrapperID), config.contentDOM).innerHTML);
  };

  api.request = function (settings) {
    try {
      var
        xhr = new window.XMLHttpRequest();

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          settings.complete(xhr);
        }
      };

      xhr.open("GET", settings.url);
      xhr.send();
    } catch (e) {
      throw "Asynchronous method not provided by browser?";
    }
  };

  api.start = function (config) {
    api.config(config);

    trapEvent(document.body, "click", localLinks);
  };
  
  api.stop = function () {
    dropEvent(document.body, "click", localLinks);
  };

  api.transition = function (h) {
    _(config.wrapperID).innerHTML = pageCache[h];
  };
  
  // register what element will hold the content returned from the server
  // register what element to pull from the DOM returned by the server
  // add event listeners to links on the page
  // request the document from the server
  // ignore links with defined rules
  // cache list/key-object store
  
  return api;
}());

Intercept.start({
  contentDOM: "section",
  wrapperID: "content_wrapper"
});