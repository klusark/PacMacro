var channel = new Channel();

function Channel() {
	var callback;
	var socket;
	var c;
	var connected = false;
	this.Connect = function(o) {
		if (!connected) {
			jx.load("connect", function(data) {
				c = new goog.appengine.Channel(data);
				socket = c.open();
				socket.onopen = channel.onOpened;
				socket.onmessage = channel.onMessage;
				socket.onerror = channel.onError;
				socket.onclose = channel.onClose;

			});
		}
		connected = true;
		callback = o;
	};

	this.onOpened = function() {
		if (callback.onOpened)
			callback.onOpened()
		//alert("onOpened");
	};

	this.onMessage = function() {
		if (callback.onMessage)
			callback.onMessage()
		alert("onMessage");
	};

	this.onError = function() {
		if (callback.onError)
			callback.onError()
		alert("onError");
	};

	this.onClose = function() {
		if (callback.onClose)
			callback.onClose()
		alert("onClose");
	};
}
