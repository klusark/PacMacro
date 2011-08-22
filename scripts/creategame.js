function CreateGame() {
	var initialHTML = "Name: <input type='text' id='name'/><br />\
	<input type='submit' value='Create Game' onclick='create.CreateGame();'/>\
	<input type='submit' value='Back' onclick='create.Back();'/>";

	this.Activate = function() {
		body.innerHTML = initialHTML;
	};

	this.Back = function() {
		menu.Activate();
	};

	this.CreateGame = function() {
		var name = document.getElementById("name").value;
		jx.load("creategame?name="+name, function(data) {});
		game.Activate(true);
	}
}

var create = new CreateGame();
