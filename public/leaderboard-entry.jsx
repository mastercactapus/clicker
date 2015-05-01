var React = require("react");
var _ = require("lodash");

var LeaderboardEntry = React.createClass({
    updateName: function (name) {
        this.setState({name: name});
    },
    updateClicks: function (clicks) {
        this.setState({clicks: clicks});
    },
    updateConnected: function (connected) {
        this.setState({connected: connected});
    },
    updatePos: function(pos) {
        this.setState({pos: pos});
    },
    componentWillUnmount: function () {
        var id = this.props.id;
        this.props.client.removeListener("name:" + id, this.updateName);
        this.props.client.removeListener("connected:" + id, this.updateConnected);
        this.props.client.removeListener("clicks:" + id, this.updateClicks);
        this.props.client.removeListener("pos:" + id, this.updatePos);
    },
    componentDidMount: function () {
        var id = this.props.id;
        this.props.client.on("name:" + id, this.updateName);
        this.props.client.on("connected:" + id, this.updateConnected);
        this.props.client.on("clicks:" + id, this.updateClicks);
        this.props.client.on("pos:" + id, this.updatePos);
    },
    getInitialState: function () {
        var client = this.props.client;
        var id = this.props.id;
        if (client.roster[id]) {
            return client.roster[id];
        } else {
            return {
                name: "",
                connected: "",
                clicks: 0,
                id: "",
            }
        }
    },
    render: function(){
        return (
            <tr className={this.state.connected ? "" : "offline"}>
                <th>{this.props.pos}</th>
                <th>{this.state.name}</th>
                <td>{this.state.clicks}</td>
            </tr>
        )
    }
});

module.exports = LeaderboardEntry;
