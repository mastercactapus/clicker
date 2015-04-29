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
        console.log("roster update", data)
        this.setState({
            totalClicks: data.totalClicks,
            totalConnected: data.totalConnected,
            roster: data.roster,
        });
    },
    componentDidMount: function () {
        this.props.client.on("roster update", this.updateRoster);
    },
    componentWillUnmount: function () {
        this.props.client.removeListener("roster update", this.updateRoster);
    },
    getInitialState: function () {
        return {
            name: this.props.client.name,
            clicks: this.props.client.clicks,
            totalClicks: this.props.client.totalClicks,
            totalConnected: this.props.client.totalConnected,
            roster: [],
        };
    },
    render: function () {
        var self = this;

        function rosterEntry(r) {
            return (
                <LeaderboardEntry key={r.id} id={r.id} client={self.props.client}/>
            )
        }

        return (
            <div>
                <button onClick={this.click} id="thebutton">Click</button>
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
