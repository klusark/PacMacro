function Login() {
	var html = "<input type='text' id='user' /><br />\
	<input type='password' id='pass' /><br />\
	<input type='submit' value='Login' onclick='login.Request('login');' />\
	<input type='submit' value='Sign Up' onclick='login.Request('signup');' />";

	this.Activate = function() {
		body.innerHTML = html;
	};

	this.Request = function(type) {
		var user, pass;
		user = document.getElementById("user").value;
		pass = document.getElementById("pass").value;
		jx.load(type+"?user="+user+"&pass="+pass, function(data) {
			FinishLogin(data);
		});
	};
}

var login = new Login();
