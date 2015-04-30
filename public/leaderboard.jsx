var React = require("react");
var _ = require("lodash");
var LeaderboardEntry = require("./leaderboard-entry.jsx");

var Leaderboard = React.createClass({
    click: function () {
        this.props.client.click();
        this.setState({
            clicks: this.props.client.clicks,
        });
    },
    updateRoster: function (data) {
        this.setState({
            totalClicks: data.totalClicks,
            totalConnected: data.totalConnected,
            roster: data.roster,
        });
    },
    timeUpdate: function(data){
        if (data.active && !this.timeUpdateInterval) {
            this.timeUpdateInterval = setInterval(this.calcTime, 100);
            this.setState({clicks: 0});
        }
        if (!data.active && this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
            this.setState({waitingForResults: true});
        }
        this.setState({active: data.active});
        this.calcTime();
    },
    calcTime: function() {
        var now = new Date().getTime();
        var start = this.props.client.startTime;
        var end = this.props.client.endTime;
        this.setState({
            timeToStart: (start - now) / 1000,
            timeRemaining: (end - now) / 1000,
        });
    },
    updateWinners: function(w) {
        if (!!w) {
            this.setState({waitingForResults: false});
        }
        this.setState({winners: w});
    },
    componentDidMount: function () {
        this.props.client.on("roster update", this.updateRoster);
        this.props.client.on("time update", this.timeUpdate);
        this.props.client.on("winners", this.updateWinners);
    },
    componentWillUnmount: function () {
        this.props.client.removeListener("roster update", this.updateRoster);
        this.props.client.removeListener("time update", this.timeUpdate);
        this.props.client.removeListener("winners", this.updateWinners);
        clearInterval(this.timeUpdateInterval);
        this.timeUpdateInterval = null;
    },
    getInitialState: function () {
        return {
            name: this.props.client.name,
            clicks: this.props.client.clicks,
            totalClicks: this.props.client.totalClicks,
            totalConnected: this.props.client.totalConnected,
            roster: [],
            active: false,
            timeToStart: 0,
            timeRemaining: 0,
            winners: null,
            waitingForResults: false,
        };
    },
    render: function () {
        var self = this;

        function rosterEntry(r) {
            return (
                <LeaderboardEntry key={r.id} id={r.id} client={self.props.client}/>
            );
        }
        
        function winner(w) {
            return (
                <span key={w.id} className="label label-success">{w.name}</span>
                );
        }
        
        var action = "";
        
        if (this.state.active) {
            if (this.state.timeToStart > 0) {
                action = <div className="text-muted"><button className="btn btn-info btn-lg" disabled="disabled" id="thebutton">Get Ready</button> Starting in: {this.state.timeToStart.toFixed(1)} seconds</div>;
            } else if (this.state.timeRemaining > 0) {
                action = <div><button className="btn btn-info btn-lg" onClick={this.click} id="thebutton">--Click--</button> <span>{this.state.timeRemaining.toFixed(1)} seconds remain</span></div>;
            }
        } else if (this.state.winners) {
            action = <h3 className="winners">Winners: {this.state.winners.map(winner)}</h3>;
        } else if (this.state.waitingForResults) {
                action = <div>Awaiting results...</div>;
        }
        

        return (
            <div>
                {action}
                <h4>Connected Users: {this.state.totalConnected}</h4>
                <table className="table-hover table">
                    <thead>
                    <tr>
                        <th>
                            #
                        </th>
                        <th>
                            Name
                        </th>
                        <th>
                            Clicks
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <th>{this.state.pos}</th>
                        <th>You</th>
                        <td>{this.state.clicks}</td>
                    </tr>
                    <tr>
                        <th></th>
                        <th>Everybody</th>
                        <td>{this.state.totalClicks}</td>
                    </tr>
                    {this.state.roster.map(rosterEntry)}
                    </tbody>
                </table>
            </div>
        )
    }
});

module.exports = Leaderboard;
