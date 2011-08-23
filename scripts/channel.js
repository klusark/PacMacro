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

	this.Disconnect = function() {
		c.close();
	}

	this.onOpened = function() {
		if (callback.onOpened)
			callback.onOpened()
	};

	this.onMessage = function(data) {
		if (callback.onMessage)
			callback.onMessage(data)
	};

	this.onError = function() {
		if (callback.onError)
			callback.onError()
	};

	this.onClose = function() {
		if (callback.onClose)
			callback.onClose()
		alert("onClose");
	};
}
