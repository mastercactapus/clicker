var React = require("react");
var ApiClient = require("./api-client.js");
var NameEntry = require("./name-entry.jsx");
var Bluebird = require("bluebird");
require("./main.css");

var client = new ApiClient();

var domReady = new Bluebird(function (resolve, reject) {
    window.addEventListener("DOMContentLoaded", resolve);
});

Bluebird.join(domReady, client.init())
    .then(function () {
        React.render(
            <NameEntry client={client} />,
            document.getElementById("app")
        );
    });


