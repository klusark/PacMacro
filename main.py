from google.appengine.api import channel, users
from google.appengine.ext import db, webapp
from google.appengine.ext.webapp import util

class Game(db.Model):
	name = db.StringProperty(required=True)
	owner = db.UserProperty()
	players = db.ListProperty(users.User);

class User(db.Model):
	user = db.UserProperty()
	game = db.ReferenceProperty(Game)

class LoginHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()

		response = "{\"loggedin\":"
		if user:
			response += "true,\"ingame\":false"
			q = User.all()
			q.filter("user", user)
			userss = q.fetch(1)
			if not userss:
				u = User(user=user)
				u.put()
		else:
			response += "false,\"url\":\""
			response += users.create_login_url("/")
			response += "\""
		response += "}"
		self.response.out.write(response)

class ConnectHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()

		token = channel.create_channel(user.user_id())
		self.response.out.write(token)

class CreateGameHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		q = Game.all()

		name = self.request.get("name")
		q.filter("name", name)
		games = q.fetch(1)
		if (games):
			self.response.out.write("Game already exists with that name")
		else:
			game = Game(name=name, owner=user)
			game.put()
			q = User.all()
			q.filter("user", user)
			u = q.fetch(1)
			if u:
				u[0].game = game
				u[0].put()

class GetGameListHandler(webapp.RequestHandler):
	def get(self):
		q = Game.all()
		games = q.fetch(10);

		response = "{\"game\":[\"\""

		for game in games:
			response = response + ",\"" + game.name + "\""
		response = response + "]}"
		self.response.out.write(response)

class JoinGameHandler(webapp.RequestHandler):
	def get(self):
		q = Game.all()
		name = self.request.get("name")
		q.filter("name", name)

		game = q.fetch(1);
		if game:
			pass


def main():
	application = webapp.WSGIApplication([
										('/login', LoginHandler),
										('/connect', ConnectHandler),
										('/creategame', CreateGameHandler),
										('/getgamelist', GetGameListHandler),
										('/joingame', JoinGameHandler)],
										 debug=True)
	util.run_wsgi_app(application)


if __name__ == '__main__':
	main()


