// msie - attachEvent
// others - addEventListener(event, function, false) // false for bubbling

var Intercept = (function () {
  var
    _ = function (id) {

      return document.getElementById(id);
    },

    api = {},
    
    browserEvents = {
      add:    (typeof attachEvent !== "undefined") ? "attachEvent" : "addEventListener",
      remove: (typeof detachEvent !== "undefined") ? "detachEvent" : "removeEventListener"
    },

    config = {},
    
    dropEvent = (function (handler) {
      var
        on = handler === "detachEvent" ? "on" : "";

      return function (element, eventType, fn) {
        element[handler](on + eventType, fn, false);
      };
    }(browserEvents.remove)),

    findContent = function (html) {
      var
        frag = document.createElement("div"),
        indx = 0,
        nodes = frag.childNodes,
        regex = new RegExp(config.contentDOM, "i"),
        result = "";

      frag.className = "custom document fragment";

      if (html.childNodes) {
        // implement later
      } else {
        frag.innerHTML = html.
          replace(/.*?<body/, "").
          replace(/<\/body>.*/, "").
          replace(/<style.*?style>/gi, "").
          replace(/<script.*?script>/gi, "");
      }

      for (indx; indx < nodes.length; indx++) {
        if (/^#/i.test(nodes[indx].nodeName || result.length > 0)) {
          continue;
        }

        if (nodes[indx].id === config.wrapperID) {
          nodes = nodes[indx].childNodes
          indx = 0;
          while (!regex.test(nodes[indx].nodeName) && indx++ < nodes.length) {}
          
          // alert(nodes[indx].parentNode.innerHTML);
          return nodes[indx].parentNode.innerHTML;
        }
        
        if (nodes[indx].childNodes.length) {
          result = findContent(nodes[indx].innerHTML);
        }
      }
      return result;
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
              api.cache(href, findContent(xhr.responseText));
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
    api.cache(window.location.href, findContent(document.body.innerHTML));
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
  
  // loading indicator
  // check for visiting a page without hash-path url
  // update url with hash-path for navigation (forward, backward)
  // ignore links with defined rules
  
  return api;
}());

Intercept.start({
  contentDOM: "section",
  wrapperID: "content_wrapper"
});