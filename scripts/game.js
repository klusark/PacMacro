function Game() {
	var initialHTML = "<table id='players'>\
	</table>\
	<select id='roles' onChange='game.SelectRole(this.options[this.selectedIndex].value);'>\
	<option>None</option>\
	<option>Pacman</option>\
	<option>Inky</option>\
	<option>Blinky</option>\
	<option>Pinky</option>\
	<option>Clide</option>\
	</select>\
	<input type='submit' value='Leave Game' onClick='game.Leave();' />\
	<input type='submit' value='Start Game' id='startbutton' onClick='game.StartGame();' />";
	var creator;
	var players;
	var localPlayerName;

	this.Activate = function() {
		this.GetGameInfo();
		channel.Connect(this);
		body.innerHTML = initialHTML;
	};

	this.onMessage = function(data) {
		game.UpdateGame(data.data);
	};

	this.Leave = function() {
		jx.load("leavegame", function(data) {
			game.FinishLeave();
		});
	};

	this.FinishLeave = function() {
		channel.Disconnect
		menu.Activate();
	}

	this.GetGameInfo = function() {
		jx.load("getgameinfo", function(data) {
			game.UpdateGame(data);
		});
	};

	this.Update = function() {
		var numPlayers = players.length;
		var table = "<tr><td>Name</td><td>Desired Role</td></tr>";
		var role = "None";
		for (var i = 1; i < numPlayers; i += 1) {
			table += "<tr><td>"+players[i].name+"</td><td>"+players[i].role+"</td></tr>";
			if (players[i].name == localPlayerName) {
				role = players[i].role;
			}
		}
		document.getElementById("players").innerHTML = table;

		document.getElementById("startbutton").disabled = !this.AllowedToStart();

		var roles = document.getElementById("roles");
		for (var i = 0; i < 6; i += 1) {
			if (roles.options[i].value == role) {
				roles.selectedIndex = i;
				break;
			}
		}
	};

	this.AllowedToStart = function() {
		//TODO: clean this up.
		var numPlayers = players.length;
		if (numPlayers != 6)
			return false;
		players[0].role = "None";
		for (var x = 0; x < numPlayers; x += 1) {
			for (var y = 1; y < numPlayers; y += 1) {
				if ((x != y && players[x].role == players[y].role)) {
					return false;
				}
			}
		}
		if (!creator)
			return false;
		return true;
	};

	this.UpdateGame = function(data) {
		var o = JSON.parse(data);
		if (o.type == "full") {
			creator = o.creator;
			players = o.players;
			localPlayerName = o.localplayer;
		} else if (o.type == "playerjoin") {
			players.push(o.player);
		} else if (o.type == "playerleave") {
			var numPlayers = players.length;
			for (var i = 1; i < numPlayers; i += 1) {
				if (players[i].name == o.player) {
					players.remove(i);
					break;
				}
			}
		} else if (o.type == "player") {
			var numPlayers = players.length;
			for (var i = 1; i < numPlayers; i += 1) {
				if (players[i].name == o.player.name) {
					players[i] = o.player
					break;
				}
			}
		} else if (o.type == "gameend") {
			this.FinishLeave();
			return;
		}
		this.Update();
	};

	this.SelectRole = function(role) {
		jx.load("updatesettings?role="+role, function(data) {
			//game.UpdateGame(data);
		});
	}
}
var game = new Game();
