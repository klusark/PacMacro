function InGame() {
	var context;
	this.Activate = function() {
		channel.Connect(this);
		body.innerHTML = "<canvas id='canvas' width='640' height='480'></canvas>";
		var canvas = document.getElementById('canvas');
		context = example.getContext('2d');
		this.Draw();
	};

	this.Draw = function() {
	};
}

var ingame = new InGame();
