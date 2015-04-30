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
        winners: null,
    };

    // set the competition to start after a delay
    // and setting a timer to end
    function startCompetition(delaySec, timeSec) {
        var now = Date.now();
        state.startTime = now + (delaySec * 1000);
        var endDuration = ((+delaySec + +timeSec) * 1000);
        state.endTime = now + endDuration;
        state.active = true;
        state.winners = null;
        _.each(state.roster, function(r) {
            r.clicks = 0;
        });
        setTimeout(endCompetition, endDuration);
        publishState();
        publishRoster();
    }

    // set active to false
    // wait 5s for pending results
    // then fire publishWinners
    function endCompetition() {
        state.active = false;
        client.publish("/end");
        publishState();
        publishRoster();
        setTimeout(publishWinners, 5000);
    }

    function publishWinners() {
        var results = _.chain(state.roster)
            .filter("connected")
            .filter("name")
            .sortByOrder(["clicks", "name"], [false, true])
            .value();

        var top = results[0].clicks;
        var winners = _.filter(results, {
            clicks: top
        });
        state.winners = winners;
        publishState();
    }

    var publishRoster = _.throttle(function() {
        var roster = _.chain(state.roster).filter("connected").filter("name");
        var data = {
            roster: roster.sortByOrder(["clicks", "name"], [false, true]).slice(0, 15).value(),
            totalConnected: roster.size().value(),
            totalClicks: roster.pluck("clicks").sum().value(),
            now: Date.now(),
        };

        var n = 0;
        var clicks = -1;
        _.each(data.roster, function(e) {
            if (e.clicks !== clicks) {
                n++;
            }
            clicks = e.clicks;
            e.pos = n;
        });

        client.publish("/roster", data);
    }, 250);

    var publishState = _.throttle(function() {
        client.publish("/state", state);
    }, 3000);

    client.subscribe("/request-state", function() {
        publishState();
    });

    client.subscribe("/client/update", function(data) {
        var c = state.roster[data.id];
        if (!c) {
            state.roster[data.id] = _.defaults(data, {
                connected: true,
                clicks: 0,
                name: ""
            });
        }
        else {
            _.extend(c, data);
        }
        if (data.connected !== false) {
            c.connected = true;
        }
        if (data.name) publishState();
        publishRoster();
    });

    var connections = {};
    client.subscribe("/connect", function(data) {
        connections[data.bayeuxId] = data.id;
        if (!state.roster[data.id]) {
            state.roster[data.id] = {
                name: "",
                id: data.id,
                connected: true,
                clicks: 0,
            };
        }
        state.roster[data.id].connected = true;
        publishRoster();
    });
    client.subscribe("/disconnect", function(data) {
        var sid = connections[data.id];
        if (!sid) return;
        connections[data.id] = "";
        if (_.includes(connections, sid)) return;

        state.roster[sid].connected = false;
        publishRoster();
    });
    client.subscribe("/_start", function(data) {
        if (data.pw !== (process.env.PW || "foobar")) return;
        startCompetition(data.delay, data.time);
    });
};
