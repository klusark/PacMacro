function Game() {
	var initialHTML = "<table id='players'>\
	</table>\
	<input type='submit' value='Leave Game' onClick='game.Leave();' />";
	var creator;
	this.Activate = function(_creator) {
		creator = _creator;
		channel.Connect(this);
		body.innerHTML = initialHTML;
	}

	this.onMessage = function() {

	}

	this.Leave = function() {

	}
}
var game = new Game();
