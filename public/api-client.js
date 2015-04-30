/**
 * Created by nathan on 4/29/15.
 */
var faye = require('faye');
var uuid = require("uuid");
var events = require("events");
var _ = require("lodash");
var Bluebird = require("bluebird");

//emits:
// start: {timeStart, timeEnd}
// stop: {}
function ApiClient() {
    this.client = new faye.Client("/ws");

    this.id = localStorage.getItem("clickapp-uuid");
    if (!this.id) {
        this.id = uuid.v4();
        localStorage.setItem("clickapp-uuid", this.id);
    }

    var self = this;
    this._initialName = new Bluebird(function(resolve, reject) {
        self._initialNameResolve = resolve;
    });

    this.roster = {};
    this.active = false;
    this.startTime = 0;
    this.endTime = 0;
    this.clicks = 0;
    this.totalClicks = 0;
    this.totalConnected = 0;
    this.winners = null;
    this.timeOffset = 0;
    this.connected = false;
}

ApiClient.prototype = {
    init: function() {
        var self = this;
        this.client.subscribe("/roster", _.bind(this._updateRoster, this));
        this.client.subscribe("/state", _.bind(this._update, this))
            .then(function() {
                self.client.publish("/request-state", {
                    id: self.id
                });
            });
        this.client.subscribe("/results", _.bind(this._results, this));
        this.client.on("transport:up", function() {
            self.connected = true;
            self.emit("connect");
        });
        this.client.on("transport:down", function() {
            self.connected = false;
            self.emit("disconnect");
        });
        
        window._start = function(a) {
            self.client.publish("/_start", a);
        };
    },
    click: function() {
        if (!this.active) return;
        var now = new Date().getTime();
        if (now < this.startTime || now > this.endTime) {
            this.active = false;
            this._timeUpdate();
            return;
        }
        this.clicks++;
        this._publishClicks();
    },
    _publishClicks: _.throttle(function() {
        this.client.publish("/client/update", {
            id: this.id,
            clicks: this.clicks
        }, {attempts: 1});
    }, 300),
    _results: function(data) {
        this.emit("results", data);
    },
    _submitClicks: function() {
        this.client.publish("/finalClicks", {
            id: this.id,
            clicks: this.clicks
        });
    },
    _start: function() {
        this.clicks = 0;
    },
    _updateRoster: function(data) {
        this.totalClicks = data.totalClicks;
        this.totalConnected = data.totalConnected;
        this.timeOffset = data.now - new Date().getTime();
        this.emit("roster update", data);
        this._update(data);
    },
    _update: function(data) {
        var self = this;
        var initName = "";
        _.each(data.roster, function(v, i) {
            var id = v.id || i;
            if (!self.roster[id]) {
                self.roster[id] = {};
                self.emit("add", id, v);
            }
            var rv = self.roster[id];
            if (rv.name !== v.name) {
                rv.name = v.name;
                self.emit("name", id, v.name);
                self.emit("name:" + id, v.name);
            }
            if (rv.clicks !== v.clicks) {
                rv.clicks = v.clicks;
                self.emit("clicks", id, v.clicks);
                self.emit("clicks:" + id, v.clicks);
            }
            if (rv.connected !== v.connected) {
                rv.connected = v.connected;
                self.emit("connect", id, v.connected);
                self.emit("connect:" + id, v.connected);
            }
            if (rv.pos !== v.pos) {
                rv.pos = v.pos;
                self.emit("pos", id, v.pos);
                self.emit("pos:" + id, v.pos);
            }

            if (id === self.id) {
                initName = v.name;
            }
            
        });

        if (self._initialNameResolve) {
            self._initialNameResolve(initName);
            self._initialNameResolve = null;
        }
        
        if (_.has(data, "startTime")) {
            this.startTime = data.startTime - this.timeOffset;
        }
        if (_.has(data, "endTime")) {
            this.endTime = data.endTime - this.timeOffset;
        }
        if (_.has(data, "active")) {
            if (data.active !== self.active) {
                if (data.active) {
                    this.clicks = 0;
                } else {
                    self._submitClicks();
                }
            }
            this.active = data.active;
        }
        if (_.has(data, "winners")) {
            this.winners = data.winners;
            this.emit("winners", data.winners);
        }
        
        this._timeUpdate();
    },
    _timeUpdate: function() {
        this.emit("time update", {start: this.startTime, end: this.endTime, active: this.active});
    },
    getName: function() {
        if (this._initialNameResolve) {
            return this._initialName;
        }
        else {
            return Bluebird.resolve(this.roster[this.id].name);
        }
    },
    setName: function(newName) {
        this.client.publish("/client/update", {
            id: this.id,
            name: newName
        });
    }
};

_.extend(ApiClient.prototype, events.EventEmitter.prototype);

module.exports = ApiClient;
