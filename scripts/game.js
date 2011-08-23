function Game() {
	var initialHTML = "<table id='players'>\
	</table>\
	<select onChange='game.SelectRole(this.options[this.selectedIndex].value);'>\
	<option>None</option>\
	<option>Pacman</option>\
	<option>Inky</option>\
	<option>Blinky</option>\
	<option>Pinky</option>\
	<option>Clide</option>\
	</select>\
	<input type='submit' value='Leave Game' onClick='game.Leave();' />\
	<input type='submit' value='Start Game' onClick='game.Leave();' />";
	var creator;
	var players;

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
			menu.Activate();
		});
	}

	this.GetGameInfo = function() {
		jx.load("getgameinfo", function(data) {
			game.UpdateGame(data);
		});
	};

	this.UpdatePlayers = function() {
		var numPlayers = players.length;
		var table = "<tr><td>Name</td><td>Desired Role</td></tr>";
		for (var i = 1; i < numPlayers; i += 1) {
			table += "<tr><td>"+players[i].name+"</td><td>"+players[i].role+"</td></tr>";
		}
		document.getElementById("players").innerHTML = table;
	};

	this.UpdateGame = function(data) {
		var o = JSON.parse(data);
		if (o.type == "full") {
			creator = o.creator;
			players = o.players;
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
			menu.Activate();
			return;
		}
		this.UpdatePlayers();
	};

	this.SelectRole = function(role) {
		jx.load("updatesettings?role="+role, function(data) {
			//game.UpdateGame(data);
		});
	}
}
var game = new Game();
