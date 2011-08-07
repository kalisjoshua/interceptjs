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
      var on = handler === "detachEvent" ? "on" : "";
      return function (element, eventType, fn) {
        element[handler](on + eventType, fn, false);
      };
    }(browserEvents.rem)),

    findChild = function (parent, child) {
      var
        indx = 0,
        nodes = parent.childNodes,
        regex = new RegExp(child, "i");
      while (!regex.test(nodes[indx].nodeName) && indx++ < nodes.length);
      return nodes[indx];
    },
    
    localLinks = function (e) {
      e = normalizeEvent(e);
      if (e.target.href !== "" && window.location.host === e.target.host) {
        e.preventDefault ? e.preventDefault() : (e.returnValue = false);
        e.target.blur();
      }
    },
    
    normalizeEvent = function (e) {
      // IE doesn't pass the event to the function grab it from the window object
      e = e || window.event;
      
      // Safari & IE support srcElement
      e.target = e.srcElement || (e.target.nodeType == 3 ? e.target.parentNode : e.target);
      e.href = (e.srcElement || e.target).href || "";

      // dont forget pathname, host, hostname, ...
      
      return e;
    },

    pageCache = {},
    
    trapEvent = (function (handler) {
      var on = handler === "attachEvent" ? "on" : "";
      return function (element, eventType, fn) {
        element[handler](on + eventType, fn, false);
      };
    }(browserEvents.add));
    
  api.cache = function (key, obj) {
    if (!obj) {
      !pageCache[key] && pageCache[key] = obj;
    } else {
      return pageCache[key];
    }
  };

  api.config = function (userConfig) {
    config = userConfig;
    api.cache(window.location.pathname, findChild(_(config.wrapperID), config.contentDOM))
  };

  api.start = function (config) {
    api.config(config);

    trapEvent(document.body, "click", localLinks);
  };
  
  api.stop = function () {
    dropEvent(document.body, "click", localLinks);
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