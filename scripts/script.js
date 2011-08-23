var body;

window.onload = function() {
	body = document.getElementById("body");
	jx.load("login", function(data) {
		var o = JSON.parse(data);
		if (o.loggedin) {
			if (o.ingame) {
				game.Activate();
			} else {
				menu.Activate();
			}
		} else {
			body.innerHTML = "<a href='"+o.url+"'>Login</a>";
		}
	});
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};
