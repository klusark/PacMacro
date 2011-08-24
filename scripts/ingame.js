function InGame() {
	var context;
	var players = [];
	var tiles = [];
	this.Activate = function() {
		channel.Connect(this);
		body.innerHTML = "<canvas id='canvas' width='548' height='548'></canvas>";
		var canvas = document.getElementById('canvas');
		context = canvas.getContext('2d');
		this.Draw();
		canvas.addEventListener("click", this.OnClick, false);
		this.GetGameInfo();
	};

	this.GetGameInfo = function() {
		jx.load("getgameinfo", function(data) {
			ingame.UpdateGame(data);
		});
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
		jx.load("moveto?pos="+tile, function(data) {ingame.UpdateGame(data);});
	};

	this.MarkTile = function(tile, type) {
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
		if (type == "Eat") {
			context.fillStyle = "rgb(127,127,127)";
		} else if (type == "Pacman") {
			context.fillStyle = "rgb(255,255,0)";
		} else if (type == "Pinky") {
			context.fillStyle = "rgb(255,0,255)";
		} else if (type == "Inky") {
			context.fillStyle = "rgb(255,0,0)";
		} else if (type == "Clide") {
			context.fillStyle = "rgb(0,0,255)";
		} else {
			context.fillStyle = "rgb(255,255,255)";
		}
		context.fillRect(x+4, y+4, 8, 8);
	};

	this.UpdateGame = function(data) {
		var o = JSON.parse(data);
		if (o.type == "move") {
			if (o.eat) {
				//this.MarkTile(o.pos, "Eat");
				tiles.push(o.pos);
			}
			this.MarkTile(o.pos, o.role);
			for (var i = 0; i < players.length; i += 1) {
				if (players[i].name == o.name) {
					players[i].pos = o.pos;
				}
			}
		} else if (o.type == "full") {
			players = o.players;
			tiles = o.tiles;
			var tilesLength = tiles.length;
			/*for (var i = 0; i < tilesLength; i += 1) {
				this.MarkTile(tiles[i], "Eat");
			}*/
		}
		this.Draw();
	};

	this.onMessage = function(data) {
		this.UpdateGame(data.data);
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
		for (var i = 0; i < 145; i += 1) {
			this.MarkTile(i);
		}
		for (var i = 0; i < tiles.length; i += 1) {
			this.MarkTile(tiles[i], "Eat");
		}
		for (var i = 0; i < players.length; i += 1) {
			this.MarkTile(players[i].pos, players[i].role);
		}
	};
}

var ingame = new InGame();
