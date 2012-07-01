var websocket;
var offset = 80;

window.onload = function() {
	"use strict";
	var role = window.location.hash.substring(1);
	var ingame = new InGame(role);
	websocket = new WebSocket("ws://127.0.0.1:37645");
	websocket.onopen = function () { websocket.send("login;" + role); };
	websocket.onmessage = function(data) { ingame.UpdateGame(data.data); };
};

/**
 * @constructor
 */
function StaticImage(img, x, y, w, h, ox, oy) {
	"use strict";
	this.Draw = function(dx, dy, ctx) {
		ctx.drawImage(img, x, y, w, h, Math.floor(dx) + ox, Math.floor(dy) + oy, w, h);
	};
}

/**
 * @constructor
 */
function InGame(role) {
	"use strict";
	var context,
		players = [],
		tiles = [],
		image = new Image(),
		images = [],

		powerPills = [19, 28, 51, 60],

		pos = -1,
		startTime,
		powerPillActive = false,
		powerPillStart,
		score,
		gameLength,
		gameOver = false,
		activated = false,
		backgroundColour = "rgb(0,0,0)",
		lineColour = "rgb(0,0,128)",
		foregroundColour = "rgb(255,255,255)";

	image.src = "images/image.png";
	images["Pacman"] = new StaticImage(image, 20, 0, 19, 20, 0, 0);
	images["Inky"] = new StaticImage(image, 39, 0, 20, 20, 0, 0);
	images["Blinky"] = new StaticImage(image, 20, 20, 20, 20, 0, 0);
	images["Pinky"] = new StaticImage(image, 40, 20, 20, 20, 0, 0);
	images["Clyde"] = new StaticImage(image, 0, 20, 20, 20, 0, 0);
	images.Eat = new StaticImage(image, 24, 40, 8, 8, 4, 4);
	images.Pill = new StaticImage(image, 16, 40, 8, 8, 4, 4);
	images.PowerPill = new StaticImage(image, 0, 40, 16, 8, 0, 4);
	images.PowerPillEat = new StaticImage(image, 31, 40, 16, 8, 0, 4);

	function FormattedMinutesSeconds(time) {
		var seconds = time % 60,
			output = Math.floor(time / 60) + ":";
		if (seconds < 10) {
			output += "0";
		}
		output += seconds;
		return output;
	}

	function TileToXY(tile) {
		var x = 0, y = 0;
		if (tile < 80) {
			x = tile % 16;
			y = ((tile - x) / 16) * 128 + offset;
			x = (x * 32) + offset;
		} else {
			tile -= 80;
			y = tile % 12;
			x = ((tile - y) / 12) * 96 + offset;
			y = (y + Math.floor(y / 3) + 1) * 32 + offset;
		}
		return {x : x, y : y};
	}

	function XYToTile(x, y) {
		var tile = -1;
		x -= offset;
		y -= offset;
		x = Math.floor(x / 16);
		y = Math.floor(y / 16);
		if (x % 2 === 0 && y % 2 === 0) {
			if (y % 8 === 0) {
				tile = x / 2 + (y / 8) * 16;
			} else if (x % 6 === 0) {
				tile = 79 + y / 2 + (x / 6) * 12 - Math.floor(y / 8);
			}
		}
		return tile;
	}

	function IsBeside(a, b) {
		var oa = TileToXY(a),
			ob = TileToXY(b);
		if ((oa.x === ob.x && (oa.y + 32 === ob.y || oa.y - 32 === ob.y)) || (oa.y === ob.y && (oa.x + 32 === ob.x || oa.x - 32 === ob.x))) {
			return true;
		}
		return false;
	}
	
	this.Activate = function() {
		activated = true;
		var canvas = document.getElementById('canvas');
		context = canvas.getContext('2d');
		canvas.addEventListener("click", this.OnClick, false);
		canvas.addEventListener("keydown", this.KeyDown, false);
		window.onkeydown = this.KeyDown;
		setInterval(this.UpdateScoreBoard, 300);
	};

	this.OnClick = function(e) {
		MoveTo(e.offsetX, e.offsetY);
	};
	
	function MoveTo(x, y) {
		var tile = XYToTile(x, y);
		if (tile === -1) {
			return;
		}

		if (pos === -1 || IsBeside(tile, pos)) {
			pos = tile;
			websocket.send("moveto;" + tile);
		}
	}
	
	this.KeyDown = function(e) {
		var o = TileToXY(pos);
		if (e.keyCode == 87 || e.keyCode == 38) {
			o.y -= 32;
			//w
		} else if (e.keyCode == 65 || e.keyCode == 37) {
			o.x -= 32;
			//a
		} else if (e.keyCode == 83 || e.keyCode == 40) {
			o.y += 32;
			//s
		} else if (e.keyCode == 68 || e.keyCode == 39) {
			o.x += 32;
			//d
		} else {
			return true;
		}
		MoveTo(o.x, o.y);
		return false;
	};

	this.MarkTile = function(tile, image) {
		var o = TileToXY(tile);
		image.Draw(o.x, o.y, context);
	};

	this.UpdateGame = function(data) {
		console.log(data);
		if (!activated) {
			this.Activate();
		}
		var o = JSON.parse(data), i;
		if (o["type"] === "move") {
			if (o["role"] === role) {
				pos = o["pos"]
			}
			if (o["role"] === "Pacman") {
				tiles.push(o["pos"]);
			}
			this.MarkTile(o["pos"], images[o["role"]]);
			for (i = 0; i < players.length; i += 1) {
				if (players[i]["role"] === o["role"]) {
					players[i]["pos"] = o["pos"];
				}
			}
			powerPillActive = o["powerPillActive"];
			if (powerPillActive) {
				powerPillStart = o["powerPillStart"];
			}
			score = o["score"];
		} else if (o["type"] === "full") {
			players = o["players"];
			tiles = o["tiles"];
			startTime = o["startTime"];
			powerPillActive = o["powerPillActive"];
			if (powerPillActive) {
				powerPillStart = o["powerPillStart"];
			}
			for (i = 0; i < players.length; i += 1) {
				this.MarkTile(players[i]["pos"], images[players[i]["role"]]);
			}
			score = o["score"];
			gameLength = o["gamelength"];
			for (i = 0; i < players.length; i += 1) {
				if (players[i]["role"] === role) {
					pos = players[i]["pos"];
				}
			}

			this.UpdateScoreBoard();
		}
		this.Draw();
	};

	this.UpdateScoreBoard = function() {
		if (gameOver) {
			return;
		}
		var time = new Date().getTime(), timetext, delta;

		context.fillStyle = backgroundColour;
		context.fillRect(150, 0, 400, 50);

		context.fillStyle = foregroundColour;
		delta = 60 * gameLength - ((time / 1000) - startTime);
		delta = Math.floor(delta);
		if (delta < 0) {
			timetext = "Game Over";
		} else {
			timetext = "Time Left: " + FormattedMinutesSeconds(delta);
		}
		context.fillText(timetext, 150, 20);
		
		if (powerPillActive) {
			delta = 120 - ((time / 1000) - powerPillStart);
			if (delta < 0) {
				powerPillActive = false;
			} else {
				context.fillText("Power Pill Time Left: " + FormattedMinutesSeconds(delta), 300, 20);
			}
		}
	};

	this.Draw = function() {
		var i;
		context.fillStyle = backgroundColour;
		context.fillRect(0, 0, 650, 650);
		context.fillStyle = lineColour;

		for (i = 0; i < 6; i += 1) {
			context.fillRect(offset + 96 * i, offset, 16, 528);
		}
		for (i = 0; i < 5; i += 1) {
			context.fillRect(offset, offset + 128 * i, 480, 16);
		}

		context.fillStyle = foregroundColour;
		for (i = 0; i < 152; i += 1) {
			if (powerPills.indexOf(i) !== -1) {
				this.MarkTile(i, images.PowerPill);
			} else {
				this.MarkTile(i, images.Pill);
			}
		}
		for (i = 0; i < tiles.length; i += 1) {
			var x = parseInt(tiles[i], 10);
			if (powerPills.indexOf(x) !== -1) {
				this.MarkTile(x, images.PowerPillEat);
			} else {
				this.MarkTile(x, images.Eat);
			}
		}
		for (i = 0; i < players.length; i += 1) {
			this.MarkTile(players[i]["pos"], images[players[i]["role"]]);
		}
		context.font = "20px sans-serif";
		context.fillStyle = foregroundColour;
		context.fillText("A", 80, 70);
		context.fillText("B", 176, 70);
		context.fillText("C", 272, 70);
		context.fillText("D", 368, 70);
		context.fillText("E", 464, 70);
		context.fillText("F", 560, 70);
		context.fillText("1", 60, 95);
		context.fillText("2", 60, 223);
		context.fillText("3", 60, 351);
		context.fillText("4", 60, 479);
		context.fillText("5", 60, 607);

		context.fillText("Score: " + score, 10, 20);
		this.UpdateScoreBoard();
	};
}
