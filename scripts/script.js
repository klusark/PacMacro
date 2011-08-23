var body;

window.onload = function() {
	body = document.getElementById("body");
	jx.load("login", function(data) {
		var o = JSON.parse(data);
		if (o.loggedin) {
			menu.Activate();
		} else {
			body.innerHTML = "<a href='"+o.url+"'>Login</a>";
		}
	});
}
