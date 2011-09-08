function Scoreboard() {
	var initialHTML = "<table id='games'></table>";
	
	this.Activate = function() {
		this.GetScoreBoard()
		body.innerHTML=initialHTML
	};
	
	this.GetScoreBoard = function() {
		jx.load("scoreboard", function(data) {
			var tableData = "<tr><td>Name</td><td>Score</td></tr>";
			var o = JSON.parse(data);
			for (var i = 0; i < o.game.length; i += 1) {
				tableData += "<tr><td>"+o.game[i].name+"</td><td>"+o.game[i].score+"</td></tr>";
			}
			document.getElementById("games").innerHTML = tableData;
		});
	}

}
var scoreboard = new Scoreboard();
