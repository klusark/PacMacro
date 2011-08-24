function InGame() {
	var context;
	this.Activate = function() {
		channel.Connect(this);
		body.innerHTML = "<canvas id='canvas' width='548' height='548'></canvas>";
		var canvas = document.getElementById('canvas');
		context = canvas.getContext('2d');
		this.Draw();
		canvas.addEventListener("click", this.OnClick, false);
	};

	this.OnClick = function(e) {
		var x = Math.floor((e.pageX-18)/16);
		var y = Math.floor((e.pageY-18)/16);
		var tile = -1;
		if ((x%2 == 0 && y%2 == 0)){
			if (y%8 == 0) {
				tile = x/2+(y/8)*17;
			} else if (x%8 == 0) {
				tile = 84+y/2+(x/8)*12-Math.floor(y/8);
			}
		}
		if (tile == -1) {
			return;
		}
		jx.load("moveto?pos="+tile, function(data) {});
	};

	this.onMessage = function(data) {
		var o = JSON.parse(data.data);
		if (o.type == "eat") {
			var tile = o.pos;
			var x = 0;
			var y = 0;
			if (tile < 85) {
				x = tile%17;
				y = ((tile-x)/17)*128+10;
				x = (x * 32) + 10;
			} else {
				tile -= 85;
				y = tile%12;
				x = ((tile-y)/12)*128+10;
				y = (y + Math.floor(y/3)+1)*32+10;
			}
			context.fillStyle = "rgb(127,127,127)";
			context.fillRect(x, y, 16, 16);
		}
	};

	this.Draw = function() {
		context.fillStyle = "rgb(0, 0, 0)";
		context.fillRect(0, 0, 548, 548);
		context.fillStyle = "rgb(0, 0, 128)";

		for (var i = 0; i < 5; i += 1) {
			var size = 128;
			context.fillRect(10+128*i, 10, 16, 528);
			context.fillRect(10, 10+128*i, 528, 16);
		}
		context.fillStyle = "rgb(255,255,255)";
		for (var x = 0; x < 5; x += 1) {
			for (var i = 0; i < 17; i += 1) {
				context.fillRect(10+128*x, 10+32*i, 16, 16);
				context.fillRect(10+32*i, 10+128*x, 16, 16);
			}
		}
	};
}

var ingame = new InGame();
