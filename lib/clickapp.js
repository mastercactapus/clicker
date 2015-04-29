/**
 * Created by nathan on 4/29/15.
 */
var _ = require("lodash");
exports.launch = function(bayeux) {
    var client = bayeux.getClient();

    var state = {
        active: false,
        startTime: 0,
        endTime: 0,
        roster: {},
        names: {},
    };

    var publishRoster = _.throttle(function(){
        var roster = _.chain(state.roster).filter("connected").filter("name");
        var data = {
            roster: roster.sortByOrder(["clicks", "name"],[false, true]).slice(0,15).value(),
            totalConnected: roster.size().value(),
            totalClicks: roster.pluck("clicks").sum().value(),
        };

        var n = 0;
        var clicks = -1;
        _.each(data.roster, function(e){
            if (e.clicks !== clicks) {
                n++;
            }
            clicks = e.clicks;
            e.pos = n;
        });

        client.publish("/roster", data);
    }, 150);

    var publishState = _.throttle(function(){
        client.publish("/state", state);
    }, 3000);

    client.subscribe("/request-state", function(){
       publishState();
    });

    client.subscribe("/client/update", function(data){
        var c = state.roster[data.id];
        if (!c) {
            state.roster[data.id] = _.defaults(data, {connected: true, clicks: 0, name: ""});
        } else {
            _.extend(c, data);
        }
        if (data.connected !== false) {
            c.connected = true;
        }
        if (data.name) publishState();
        publishRoster();
    });

    var connections = {};
    client.subscribe("/connect", function(data){
        connections[data.bayeuxId] = data.id;
        if (!state.roster[data.id]) {
            state.roster[data.id] = {
                name: "",
                id: data.id,
                connected: true,
                clicks: 0,
            }
        };
        state.roster[data.id].connected = true;
        publishRoster();
    });
    client.subscribe("/disconnect", function(data){
        var sid = connections[data.id];
        if (!sid) return;
        connections[data.id] = "";
        if (_.includes(connections, sid)) return;

        state.roster[sid].connected = false;
        publishRoster();
    });
};
