function Game() {
	var initialHTML = "<table id='players'>\
	</table>\
	<input type='submit' value='Leave Game' onClick='game.Leave();' />";
	var creator;
	var players;

	this.Activate = function() {
		this.GetGameInfo();
		channel.Connect(this);
		body.innerHTML = initialHTML;
	}

	this.onMessage = function(data) {
		game.UpdateGame(data.data);
	}

	this.Leave = function() {
		jx.load("leavegame", function(data) {
			menu.Activate();
		});
	}

	this.GetGameInfo = function() {
		jx.load("getgameinfo", function(data) {
			game.UpdateGame(data);
		});
	}

	this.UpdatePlayers = function() {
		var numPlayers = players.length;
		var table = "";
		for (var i = 1; i < numPlayers; i += 1) {
			table += "<tr><td>"+players[i]+"</td></tr>";
		}
		document.getElementById("players").innerHTML = table;
	}

	this.UpdateGame = function(data) {
		var o = JSON.parse(data);
		if (o.type == "full") {
			creator = o.creator;
			players = o.players;
			this.UpdatePlayers();
		} else if (o.type == "playerjoin") {
			players.push(o.player);
			this.UpdatePlayers();
		} else if (o.type == "playerleave") {
			var numPlayers = players.length;
			for (var i = 1; i < numPlayers; i += 1) {
				if (players[i] == o.player) {
					players.remove(i);
					break;
				}
			}
			this.UpdatePlayers();
		}
	}
}
var game = new Game();
