// msie - attachEvent
// others - addEventListener(event, function, false) // false for bubbling

var Intercept = (function () {
  var
    api = {},
    
    browserEvents = {
      add: (typeof attachEvent !== "undefined") ? "attachEvent" : "addEventListener",
      rem: (typeof detachEvent !== "undefined") ? "detachEvent" : "removeEventListener"
    },
    
    dropEvent = (function (handler) {
      var on = handler === "detachEvent" ? "on" : "";
      return function (element, eventType, fn) {
        element[handler](on + eventType, fn, false);
      };
    }(browserEvents.rem)),
    
    localLinks = function (e) {
      e = normalizeEvent(e);
      alert(e.href);
      // if (e.target.nodeName == "A" && window.location.host === e.target.host) {
        // e.target.pathname
        e.preventDefault ? e.preventDefault() : (e.returnValue = false);
        e.target.blur();
      // }
    },
    
    normalizeEvent = function (e) {
      e = e || window.event;
      e.target = e.srcElement || (e.target.nodeType == 3 ? e.target.parentNode : e.target);
      e.href = (e.srcElement || e.target).href || "";
      
      return e;
    },
    
    trapEvent = (function (handler) {
      var on = handler === "attachEvent" ? "on" : "";
      return function (element, eventType, fn) {
        element[handler](on + eventType, fn, false);
      };
    }(browserEvents.add));
    
  // register what element will hold the content returned from the server
  
  //
  api.start = function () {
    
    trapEvent(document.body, "click", localLinks);
  };
  
  api.stop = function () {
    
    dropEvent(document.body, "click", localLinks);
  };
  
  // register what element to pull from the DOM returned by the server
  
  // 
  api.trap = function (element, event, fn) {
    trapEvent(element, event, fn);
  };
  
  // add event listeners to links on the page
  // request the document from the server
  // ignore links with defined rules
  // cache list/key-object store
  
  return api;
}());

Intercept.start();