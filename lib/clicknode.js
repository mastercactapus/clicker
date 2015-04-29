/**
 * Created by nathan on 4/29/15.
 */
var _ = require("lodash");
exports.launch = function(bayeux) {
    var client = bayeux.getClient();
    bayeux.on("unsubscribe", function(id, channel){
        if (channel === "/state") {
            client.publish("/disconnect", {bayeuxId: id});
        }
    });
    bayeux.on("publish", function(id, channel, data){
        if (channel === "/request-state") {
            client.publish("/connect", {bayeuxId: id, id: data.id});
        }
    });
};
