function Game() {
	var initialHTML = "<table id='players'>\
	</table>";
	var creator;
	this.Activate = function(_creator) {
		creator = _creator;
		channel.Connect(this);
	}

	this.onMessage = function() {

	}
}
var game = new Game();
