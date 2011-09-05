
function StaticImage(img, x, y, w, h, ox, oy) {
	if (!ox || !oy) {
		ox = 0;
		oy = 0;
	}

	this.Draw = function(dx, dy, ctx) {
		ctx.drawImage(img, x, y, w, h, Math.floor(dx)+ox, Math.floor(dy)+oy, w, h);
	};
}

function InGame() {
	var context;
	var players = [];
	var tiles = [];
	var image = new Image();
	image.src = "images/image.png";
	var images = [];
	images["Pacman"] = new StaticImage(image, 20, 0, 19, 20);
	images["Inky"] = new StaticImage(image, 39, 0, 20, 20);
	images["Blinky"] = new StaticImage(image, 20, 20, 20, 20);
	images["Pinky"] = new StaticImage(image, 40, 20, 20, 20);
	images["Clyde"] = new StaticImage(image, 0, 20, 20, 20);
	images["Clide"] = new StaticImage(image, 0, 20, 20, 20);
	images["Eat"] = new StaticImage(image, 24, 40, 8, 8, 4, 4);
	images["Pill"] = new StaticImage(image, 16, 40, 8, 8, 4, 4);
	images["PowerPill"] = new StaticImage(image, 0, 40, 16, 8, 0, 48);

	var pos = -1;

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
				tile = x/2+(y/8)*16;
			} else if (x%6 == 0) {
				tile = 79+y/2+(x/6)*12-Math.floor(y/8);
			}
		}
		console.log(tile, x, y);
		if (tile == -1) {
			return;
		}

		if (pos == -1 || ingame.IsBeside(tile, pos)) {
			pos = tile;
			jx.load("moveto?pos="+tile, function(data) {ingame.UpdateGame(data);});
		}
	};

	this.TileToXY = function(tile) {
		var x = 0;
		var y = 0;
		if (tile < 80) {
			x = tile%16;
			y = ((tile-x)/16)*128+10;
			x = (x * 32) + 10;
		} else {
			tile -= 80;
			y = tile%12;
			x = ((tile-y)/12)*96+10;
			y = (y + Math.floor(y/3)+1)*32+10;
		}
		var o = {};
		o.x = x;
		o.y = y;
		return o;
	}

	this.IsBeside = function(a, b) {
		var oa, ob;
		oa = this.TileToXY(a);
		ob = this.TileToXY(b);
		if (oa.x == ob.x && (oa.y + 32 == ob.y || oa.y - 32 == ob.y)) {
			return true;
		} else if (oa.y == ob.y && (oa.x + 32 == ob.x || oa.x - 32 == ob.x)) {
			return true;
		}
		return false;
	};

	this.MarkTile = function(tile, type) {
		var o = this.TileToXY(tile);
		if (type) {
			images[type].Draw(o.x, o.y, context);
		}
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
			for (var i = 0; i < players.length; i += 1) {
				this.MarkTile(players[i].pos, players[i].role);
			}
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

		for (var i = 0; i < 6; i += 1) {
			context.fillRect(10+96*i, 10, 16, 528);
		}
		for (var i = 0; i < 5; i += 1) {
			context.fillRect(10, 10+128*i, 480, 16);
		}

		context.fillStyle = "rgb(255,255,255)";
		for (var i = 0; i < 152; i += 1) {
			if (i == 19 || i == 28 || i == 51 || i == 60) {
				this.MarkTile(i, "PowerPill");
			} else {
				this.MarkTile(i, "Pill");
			}
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
