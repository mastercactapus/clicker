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

    function isNameOk(id, name) {
        if (name.length < 3) return "name too short, must be > 3 characters";
        if (name.length > 16) return "name too long, must be < 17 characters";
        if (!/^[a-z0-9 ]+$/i.test(name)) return "name must be alphanumeric";
        var exists = _.any(state.roster, function(r, rid) {
            if (rid === id) return false;
            return r.name.toLowerCase() === name.toLowerCase();
        });
        if (exists) return "name already in use, try again";
        return null;
    }

    var publishRoster = _.throttle(function() {
        var roster = _.chain(state.roster).filter("connected").filter("name");
        var data = {
            roster: roster.sortByOrder(["clicks", "name"], [false, true]).slice(0, 15).value(),
            totalConnected: roster.size().value(),
            totalClicks: roster.pluck("clicks").sum().value(),
            now: Date.now(),
        };

        client.publish("/roster", data);
    }, 250);

    var publishState = _.throttle(function() {
        var s = _.omit(state, "roster");
        s.roster = _.chain(state.roster).filter("name").value();
        client.publish("/state", s);
    }, 3000);

    client.subscribe("/request-state", function() {
        publishState();
    });

    client.subscribe("/client/update", function(data) {
        var c = state.roster[data.id];
        if (!c) {
            state.roster[data.id] = c = {
                connected: true,
                clicks: 0,
                name: ""
            };
        }

        if (_.has(data, "name")) {
            var err = isNameOk(data.id, data.name);
            if (err) {
                client.publish("/name-error/" + data.id, {
                    name: c.name,
                    error: err
                });
                data = _.omit(data, "name");
            }
        }

        _.extend(c, data);

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
        state.roster[data.id].disconnectAt = null;
        state.roster[data.id].connected = true;
    });
    client.subscribe("/request-state", publishState);
    client.subscribe("/disconnect", function(data) {
        var sid = connections[data.bayeuxId];
        if (!sid) return;
        connections[data.bayeuxId] = "";
        if (_.includes(connections, sid)) return;
        state.roster[sid].connected = false;
        state.roster[sid].disconnectAt = Date.now();
        publishState();
    });
    client.subscribe("/_start", function(data) {
        if (data.pw !== (process.env.PW || "foobar")) return;
        startCompetition(data.delay, data.time);
    });

    function rosterCleanup() {
        //don't cleanup during the click-a-thon
        if (state.active) return;
        var toolate = Date.now() - 15000;
        state.roster = _.omit(state.roster, function(r) {
            if (r.connected || !r.disconnectAt) return false;
            return r.disconnectAt < toolate;
        });
        publishState();
    }

    setInterval(rosterCleanup, 20000);
    setInterval(publishState, 8000);
};
