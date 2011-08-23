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

def GetUser(user):
	q = User.all()
	q.filter("user", user)
	result = q.fetch(1)
	if result:
		return result[0]
	else:
		return None

class LoginHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()

		response = "{\"loggedin\":"
		if user:
			response += "true,\"ingame\":"
			u = GetUser(user)
			if not u:
				u = User(user=user)
				u.put()
			if u and u.game:
				response += "true"
			else:
				response += "false"

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
			game.players.append(user)
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
			response += ",\"" + game.name + "\""
		response = response + "]}"
		self.response.out.write(response)

class JoinGameHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		q = Game.all()
		name = self.request.get("name")
		q.filter("name", name)

		game = q.fetch(1);
		if game:
			g = game[0]
			if len(g.players) < 4:
				for player in g.players:
					channel.send_message(player.user_id(), "{\"type\":\"playerjoin\",\"player\":\"" + user.nickname() + "\"}")
				g.players.append(user)
				g.put()
				u = GetUser(user)
				if u:
					u.game = g
					u.put()

class LeaveGameHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		q = User.all()
		q.filter("user", user)
		result = q.fetch(1)
		if result:
			u = result[0]
			if user == u.game.owner:
				#for 
				u.game.delete()
			elif user in u.game.players:
				u.game.players.remove(user)
				for player in u.game.players:
					channel.send_message(player.user_id(), "{\"type\":\"playerleave\",\"player\":\"" + user.nickname() + "\"}")
				u.game.put()
			u.game = None
			u.put()

class GameInfoHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		q = User.all()
		q.filter("user", user)
		result = q.fetch(1)
		response = "{\"type\":\"full\","
		if result:
			response += "\"creator\":"
			if result[0].game.owner == user:
				response += "true"
			else:
				response += "false"
			response += ",\"players\":[\"\""
			for player in result[0].game.players:
				response += ",\"" + player.nickname() + "\""
			response += "]"
		response += "}"
		self.response.out.write(response)


def main():
	application = webapp.WSGIApplication([
										('/login', LoginHandler),
										('/connect', ConnectHandler),
										('/creategame', CreateGameHandler),
										('/getgamelist', GetGameListHandler),
										('/joingame', JoinGameHandler),
										('/getgameinfo', GameInfoHandler),
										('/leavegame', LeaveGameHandler)],
										 debug=True)
	util.run_wsgi_app(application)


if __name__ == '__main__':
	main()


