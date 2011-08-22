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
