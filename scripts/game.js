function Game() {
	var initialHTML = "<table id='players'>\
	</table>\
	<select id='roles' onChange='game.SelectRole(this.options[this.selectedIndex].value);'>\
	<option>None</option>\
	<option>Pacman</option>\
	<option>Inky</option>\
	<option>Blinky</option>\
	<option>Pinky</option>\
	<option>Clyde</option>\
	</select>\
	<select id='length' onChange='game.SetLength(this.options[this.selectedIndex].value);' disabled>\
	<option>5</option>\
	<option>10</option>\
	<option>15</option>\
	<option>20</option>\
	<option>25</option>\
	<option selected>30</option>\
	<option>35</option>\
	<option>40</option>\
	<option>45</option>\
	<option>50</option>\
	<option>55</option>\
	<option>60</option>\
	</select>\
	<input type='submit' value='Leave Game' onClick='game.Leave();' />\
	<input type='submit' value='Start Game' id='startbutton' onClick='game.StartGame();' disabled />";
	var creator;
	var players;
	var localPlayerId = -1,
	gameLength;

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
		for (var i = 0; i < numPlayers; i += 1) {
			table += "<tr><td>"+players[i].name+"</td><td>"+players[i].role+"</td></tr>";
		}
		if (localPlayerId != -1) {
			role = players[localPlayerId].role;
		}
		document.getElementById("players").innerHTML = table;

		document.getElementById("startbutton").disabled = !this.AllowedToStart();
		var length = document.getElementById("length");
		length.disabled = !creator;
		var roles = document.getElementById("roles");
		for (var i = 0; i < 6; i += 1) {
			if (roles.options[i].value == role) {
				roles.selectedIndex = i;
				break;
			}
		}
		for (var i = 0; i < 12; i += 1) {
			if (length.options[i].value == gameLength) {
				length.selectedIndex = i;
				break;
			}
		}
	};

	this.AllowedToStart = function() {
		return creator;
		//TODO: clean this up.
		var numPlayers = players.length;
		//TODO: Make this check the correct number of players.
		if (numPlayers < 6)
			return false;
		//players[0].role = "None";
		for (var x = 0; x < numPlayers; x += 1) {
			for (var y = 0; y < numPlayers; y += 1) {
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
			localPlayerId = o.localPlayer;
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
			for (var i = 0; i < numPlayers; i += 1) {
				if (players[i].name == o.player.name) {
					players[i] = o.player
					break;
				}
			}
		} else if (o.type == "gameend") {
			this.FinishLeave();
			return;
		} else if (o.type == "startgame") {
			ingame.Activate();
			return;
		} else if (o.type == "length") {
			gameLength = o.length;
			
		}
		this.Update();
	};

	this.StartGame = function() {
		jx.load("startgame", function(data) {
			// Check to make sure that the game is allowed to be started.
		});
	}

	this.SelectRole = function(role) {
		jx.load("updatesettings?role="+role, function(data) {
		});
	};
	
	this.SetLength = function(length) {
		jx.load("updatesettings?length="+length, function(data) {
		});
	};
}
var game = new Game();
