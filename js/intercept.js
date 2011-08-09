// msie - attachEvent
// others - addEventListener(event, function, false) // false for bubbling

var Intercept = (function () {
    var
        _ = function (id) {

            return document.getElementById(id);
        },

        api = {},

        buildConfig = function (userConfig) {
            config = userConfig;
            config.content_wrapper = _(config.contentID);
        },
        
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
                div,
                indx = 0,
                nodes,
                regex = new RegExp(config.contentDOM, "i"),
                result;

            if (!html.childNodes) {
                div = document.createElement("div");
                div.className = "custom document fragment";
                // div.title = html.replace(/.*?<title>(.*?)<\/title>.*/gim, "$1");
                div.innerHTML = html.
                    replace(/\n/g, "~n~").
                    replace(/.*?<body>/i, "").
                    replace(/<\/body>.*/i, "").
                    replace(/<style.*?style>/gi, "").
                    replace(/<script.*?script>/gi, "").
                    replace(/~n~/g, "\n");
                html = div;
            }

            for (indx; indx < (nodes = html.childNodes).length; indx++) {
                if (/^#/i.test(nodes[indx].nodeName)) {
                    continue;
                }

                if (nodes[indx].id === config.contentID) {
                    return nodes[indx];
                }
                
                if (nodes[indx].childNodes.length) {
                    result = findContent(nodes[indx]);
                    if (result) {
                        break;
                    }
                }
            }

            return result;
        },
        
        localLinks = function (e) {
            e = normalizeEvent(e);

            // for some reason IE adds a port number to the end of host
            if (e.target.href !== "" && window.location.host === e.target.host.replace(/:.*/, "")) {
                e.preventDefault ? e.preventDefault() : (e.returnValue = false);
                e.target.blur && e.target.blur();
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
        
    api.cache = function (key, obj, div) {
        if (obj) {
            if (div) {
                // content already exists
                obj = obj.cloneNode(true);
                config.content_wrapper.innerHTML = "";
            }
            div = document.createElement("div");
            div.innerHTML = obj.innerHTML;
            div.style.display = "none";

            config.content_wrapper.appendChild(div);

            pageCache[key] = div;
        }
        return !!key ? pageCache[key] : (function (pageCache, node, result) {
            result = [];

            for (node in pageCache) {
                pageCache.hasOwnProperty(node) && result.push(pageCache[node]);
            }

            return result;
        }(pageCache));
    };

    api.request = function (settings) {
        try {
            var
                xhr = new window.XMLHttpRequest();

            xhr.onreadystatechange = function () {
                xhr.readyState === 4 && settings.complete(xhr);
            };

            xhr.open("GET", settings.url);
            xhr.send();
        } catch (e) {
            throw "Asynchronous method not provided by browser?";
        }
    };

    api.start = function (userConfig) {
        var
            startingURL = window.location.href.replace(/#.*/g, "");

        buildConfig(userConfig);

        trapEvent(document.body, "click", localLinks);
        
        // cache the page requested since it is already in the DOM
        api.cache(startingURL, findContent(document.body.parentNode), true);
        api.transition(startingURL, true);

        // if the url contains a different page location in the hash load that page
        if (window.location.hash.length && window.location.hash.slice(1) !== window.location.pathname) {
            localLinks({
                target: {
                    href: window.location.protocol + "//" + window.location.host + window.location.hash.slice(1),
                    host: window.location.host
                }
            });
        }
    };
    
    api.stop = function () {
        dropEvent(document.body, "click", localLinks);
    };

    api.transition = function (h, skipAnimation) {
        var
            indx = 0,
            nodes = api.cache();

        h = (function (href, link) {
            link.href= href;
            return link;
        }(h, document.createElement("a")));


        !skipAnimation && (window.location.hash = h.pathname);

        for (indx; indx < nodes.length; indx++) {
            nodes[indx].style.display = "none";
        }

        api.cache(h).style.display = "block";
        
    };
    
    // cache DOM objcets instead of innerHTML
    // loading indicator
    // update url with hash-path for navigation (forward, backward)
    // push state api
    // ignore links with defined rules
    
    return api;
}());

Intercept.start({
    contentID: "content_wrapper"
});