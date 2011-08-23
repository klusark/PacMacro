function GamesMenu() {
	var initialHTML = "<table id='games'></table>\
	<input type='submit' value='Create Game' onclick='menu.CreateGame();'/>\
	<input type='submit' value='Refresh' onclick='menu.Refresh();'/>";

	this.Activate = function() {
		body.innerHTML = initialHTML;
		this.Refresh();
	};

	this.Refresh = function() {
		jx.load("getgamelist", function(data) {
			var tableData = "<tr><td>Name</td><td>Join</td></tr>";
			var o = JSON.parse(data);
			var len = o.game.length;
			for (var i = 1; i < len; i += 1) {
				tableData += "<tr><td>"+o.game[i]+"</td><td><input type='submit' value='Join' onclick='menu.JoinGame(\""+o.game[i]+"\");'/></td></tr>";
			}
			document.getElementById("games").innerHTML = tableData;
		});
	};

	this.CreateGame = function() {
		//var value = document.getElementById("gamename").value;
		//jx.load("creategame?name="+value, function(data) {});
		create.Activate();
	};

	this.JoinGame = function(name) {
		jx.load("joingame?name="+name, function(data) {
			var o = JSON.parse(data);
			if (!o.error)
				game.Activate(false);
			else
				menu.Refresh();
		});
	};
}
var menu = new GamesMenu();
