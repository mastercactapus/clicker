var React = require("react");
var Leaderboard = require("./leaderboard.jsx");

var NameEntry = React.createClass({
    getInitialState: function () {
        var client = this.props.client;
        var self = this;
        client.on("connect", function () {
            self.setState({connected: true});
        });
        client.on("disconnect", function () {
            self.setState({connected: false});
        });
        client.on("name:" + client.id, function (newName) {
            self.setState({name: newName});
        });
        client.getName()
            .then(function (name) {
                self.setState({
                    name: name,
                    gotName: true,
                });
            });
        return {
            error: "",
            edit: false,
            name: "",
            enteredName: "",
            connected: client.connected,
            gotName: false,
        }
    },
    updateEnteredName: function (e) {
        this.setState({
            enteredName: document.getElementById("name").value.toString()
        });
        e.preventDefault();
    },
    startEdit: function (e) {
        this.setState({
            edit: true,
            enteredName: this.state.name,
        });
        e.preventDefault();
    },
    cancelEdit: function (e) {
        this.setState({
            edit: false,
            enteredName: this.state.name,
        });
        e.preventDefault();
    },
    setName: function (e) {
        e.preventDefault();
        var name = this.state.enteredName.trim().replace(/ +/, " ");
        if (name.length < 3) {
            this.setState({
                error: "name must be longer than 3 characters"
            });
            return;
        }

        if (name.length > 16) {
            this.setState({
                error: "name must be shorter than 17 characters"
            });
            return;
        }

        if (!/^[a-z0-9 ]+$/.test(name)) {
            this.setState({
                error: "name must be alpha-numeric"
            });
            return;
        }
        this.setState({
            name: name,
            edit: false,
            enteredName: name,
            error: "",
        });
        this.props.client.setName(name);
        return;
    },
    render: function () {
        var err, btns;
        if (!this.state.connected || !this.state.gotName) {
            return (
                <h3>Connecting...</h3>
            );
        }

        if (!this.state.edit && this.state.name) {
            return (
                <div>
                    <h3>Known as: <span className="name-highlight">{this.state.name}</span>
                        <small><a onClick={this.startEdit} href="#">change</a></small>
                    </h3>
                    <hr />
                    <Leaderboard client={this.props.client} />
                </div>
            )
        }

        if (this.state.name) {
            btns = (
                <div className="form-group">
                    <button type="submit" onClick={this.setName} className="name-btn btn btn-success btn-sm">OK</button>
                    <button type="cancel" onClick={this.cancelEdit} className="name-btn btn btn-warning btn-sm">Cancel</button>
                </div>
            )
        } else {
            btns = (
                <button type="submit" className="name-btn btn btn-success btn-sm">OK</button>
            )
        }


        return (
            <div className="form-group">
                <form onSubmit={this.setName} className="form-inline">
                    <div className="text-danger">{this.state.error}</div>
                    <div className="form-group">
                        <label htmlFor="name">Your Name:</label>
                        <input className="form-control" onChange={this.updateEnteredName} name="name" id="name"
                               value={this.state.enteredName}/>
                    </div>
                    {btns}
                </form>
            </div>
        )
    }
});

module.exports = NameEntry;
