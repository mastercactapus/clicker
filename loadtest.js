var Bluebird = require("bluebird");
var _ = require("lodash");
var ApiClient = require("./lib/api-client");
ApiClient.prototype._connectUrl = process.argv[2];

var startInt = (Math.random()*100000)|0;
var clients = [];
for (var i = 0; i < 15; i++) {
    var client = new ApiClient();
    clients.push(client.init().setName("loadtest" + (i + startInt)).return(client));
}

console.log("Connecting");
Bluebird.all(clients)
.each(function(client){
    setInterval(_.bind(client.click, client), 65);
})

