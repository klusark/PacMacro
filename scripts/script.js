var channel = new Channel();
var body;

window.onload = function() {
	body = document.getElementById("body");
	jx.load("login", function(data) {
		if (data == "Yes") {
			menu.Activate();
		} else {
			body.innerHTML = "<a href='"+data+"'>Login</a>";
		}
	});	
}



function Channel() {
	this.onOpened = function() {
		//alert("onOpened");
	}
	this.onMessage = function() {
		alert("onMessage");
	}
	this.onError = function() {
		alert("onError");
	}
	this.onClose = function() {
		alert("onClose");
	}
}


function ChannelConnect() {
	jx.load("connect", function(data) {
		var income = JSON.parse(data);
		
		var c = new goog.appengine.Channel(income.token);
		var socket = c.open();
		socket.onopen = channel.onOpened;
		socket.onmessage = channel.onMessage;
		socket.onerror = channel.onError;
		socket.onclose = channel.onClose;
		
		// Check state and go to that state
		menu.Activate();
	});
}
