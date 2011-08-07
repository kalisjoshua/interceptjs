// Provide the XMLHttpRequest class for IE 5.x-6.x:
// Other browsers (including IE 7.x-8.x) ignore this when XMLHttpRequest is predefined
if (typeof window.XMLHttpRequest === "undefined") {
    window.XMLHttpRequest = function () {
        try {
            return new ActiveXObject("Msxml2.XMLHTTP.6.0");
        } catch (a) {}
        try {
            return new ActiveXObject("Msxml2.XMLHTTP.3.0");
        } catch (b) {}
        try {
            return new ActiveXObject("Msxml2.XMLHTTP");
        } catch (c) {}
        try {
            return new ActiveXObject("Microsoft.XMLHTTP");
        } catch (d) {}
        throw new Error("XMLHttpRequest not supported by this browser.");
    };
}