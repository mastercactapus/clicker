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
    this._initialName = new Bluebird(function(resolve, reject){
        self._initialNameResolve = resolve;
    });

    this.roster = {};
    this.active = false;
    this.startTime = 0;
    this.endTime = 0;
    this.clicks = 0;
    this.totalClicks = 0;
    this.totalConnected = 0;
    this.winners = [];
    this.connected = false;
}

ApiClient.prototype = {
    init: function() {
        var self = this;
        this.client.subscribe("/roster", _.bind(this._updateRoster, this));
        this.client.subscribe("/state", _.bind(this._update, this));
        this.client.subscribe("/results", _.bind(this._results, this));
        this.client.on("transport:up", function(){
            self.connected = true;
            self.emit("connect");
        });
        this.client.on("transport:down", function(){
            self.connected = false;
            self.emit("disconnect");
        });
        this.client.publish("/request-state", {id: this.id});
    },
    click: function() {
        this.clicks++;
        this._publishClicks();
    },
    _publishClicks: _.throttle(function() {
        this.client.publish("/client/update", {id: this.id, clicks: this.clicks});
    }, 1000),
    _results: function(data) {
        self.emit("results", data);
    },
    _submitClicks: function() {
        this.client.publish("/finalClicks", {id: this.id, clicks: this.clicks});
    },
    _start: function() {
        this.clicks = 0;
        this.emit("start", this.startTime, this.endTime);
    },
    _updateRoster: function(data) {
        this.totalClicks = data.totalClicks;
        this.totalConnected = data.totalConnected;
        this.emit("roster update", data);
        this._update(data);
    },
    _update: function(data) {
        var self = this;
        var initName = "";
        _.each(data.roster, function(v, i){
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
        self.startTime = data.startTime;
        self.endTime = data.endTime;
        if (data.active !== self.active) {
            self.active = data.active;
            if (data.active) {
                self._start();
            } else {
                self.emit("end");
                self._submitClicks();
            }
        }
    },
    getName: function() {
        if (this._initialNameResolve) {
            return this._initialName;
        } else {
            return Bluebird.resolve(this.roster[this.id].name);
        }
    },
    setName: function(newName) {
        this.client.publish("/client/update", {id: this.id, name: newName});
    }
};

_.extend(ApiClient.prototype, events.EventEmitter.prototype);

module.exports = ApiClient;
