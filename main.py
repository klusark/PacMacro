from google.appengine.api import channel, users
from google.appengine.ext import db, webapp
from google.appengine.ext.webapp import util

class Game(db.Model):
	name = db.StringProperty(required=True)
	owner = db.UserProperty()
	players = db.ListProperty(users.User)
	started = db.BooleanProperty()
	eaten = db.ListProperty(int)

class User(db.Model):
	user = db.UserProperty()
	game = db.ReferenceProperty(Game)
	role = db.StringProperty()
	pos = db.IntegerProperty()

def GetUser(user):
	q = User.all()
	q.filter("user", user)
	result = q.fetch(1)
	if result:
		return result[0]
	else:
		return None

def IsRoleGood(role):
	return True

class LoginHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()

		response = '{"loggedin":'
		if user:
			response += 'true,"ingame":'
			u = GetUser(user)
			if not u:
				u = User(user=user, role="None")
				u.put()
			#TODO: Check if the game is actually valid as it will crash if it is not.
			if u and u.game:
				response += 'true,"started":'
				if u.game.started:
					response += "true"
				else:
					response += "false"
			else:
				response += "false"

		else:
			response += 'false,"url":"%s"' % users.create_login_url("/")
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

		response = '{"game":[""'

		for game in games:
			response += ',"%s"' % game.name
		response = response + "]}"
		self.response.out.write(response)

class JoinGameHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		q = Game.all()
		name = self.request.get("name")
		q.filter("name", name)
		response = "{}"
		game = q.fetch(1);
		if game and game[0]:
			g = game[0]
			if len(g.players) < 5:
				u = GetUser(user)
				for player in g.players:
					channel.send_message(player.user_id(), '{"type":"playerjoin","player":{"name":"%s", "role":"%s"}}' % (user.nickname(), u.role))
				g.players.append(user)
				g.put()

				if u:
					u.game = g
					u.put()
			else:
				response = '{"error":"game full"}'
		else:
			response = '{"error":"game not found"}'
		self.response.out.write(response)

class LeaveGameHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		u = GetUser(user)
		if not u:
			return
		if user == u.game.owner:
			for player in u.game.players:
				p = GetUser(player)
				p.game = None
				p.put()
				channel.send_message(player.user_id(), '{"type":"gameend"}')
			u.game.delete()
		elif user in u.game.players:
			u.game.players.remove(user)
			for player in u.game.players:
				channel.send_message(player.user_id(), '{"type":"playerleave","player":"%s"}' % user.nickname())
			u.game.put()
		u.game = None
		u.put()

class GameInfoHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		u = GetUser(user)
		if not u or not u.game:
			return
		if u.game.started:
			if u.role == "Pacman":
				response = '{"type":"full","tiles":['
				for i in u.game.eaten:
					response += '"%s",' % i
				response = response[:-1]
				response += ']'
			else:
				response = '{"type":"full","tiles":[]'
		else:
			response = '{"type":"full","localplayer":"%s","creator":' % user.nickname()

			if u.game.owner == user:
				response += "true"
			else:
				response += "false"
		response += ',"players":[{}'
		for player in u.game.players:
			p = GetUser(player)
			pos = p.pos
			if p.role == "Pacman" and u.role != "Pacman":
				pos = -1
			response += ',{"name":"%s","role":"%s","pos":"%s"}' % (player.nickname(), p.role, pos)
		response += "]}"
		self.response.out.write(response)

class UpdateSettingsHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		role = self.request.get("role")
		if not IsRoleGood(role):
			return
		u = GetUser(user)
		if not u:
			return

		for player in u.game.players:
			channel.send_message(player.user_id(), '{"type":"player","player":{"name":"%s", "role":"%s"}}' % (user.nickname(), role))

		u.role = role;
		u.put()

class StartGameHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		u = GetUser(user)
		if not u:
			return

		#TODO: make sure the game is actually valid to start.
		u.game.started = True
		u.game.put()
		for player in u.game.players:
			channel.send_message(player.user_id(), '{"type":"startgame"}')

class MoveToHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		u = GetUser(user)
		if not u:
			return
		poss = self.request.get("pos")
		pos = int(poss)
		u.pos = pos
		u.put()
		message = '{"type":"move","pos":"%s","name":"%s","role":"%s"' % (poss, user.nickname(), u.role)
		if u.role == "Pacman" and not pos in u.game.eaten:
			u.game.eaten.append(pos)
			u.game.put()
			message += ',"eat":"true"'
		message += "}"
		self.response.out.write(message)
		if u.role == "Pacman":
			return
		for player in u.game.players:
			p = GetUser(player)
			if p != u:
				channel.send_message(player.user_id(), message)

def main():
	application = webapp.WSGIApplication([
										('/login', LoginHandler),
										('/connect', ConnectHandler),
										('/creategame', CreateGameHandler),
										('/getgamelist', GetGameListHandler),
										('/joingame', JoinGameHandler),
										('/getgameinfo', GameInfoHandler),
										('/leavegame', LeaveGameHandler),
										('/updatesettings', UpdateSettingsHandler),
										('/startgame', StartGameHandler),
										('/moveto', MoveToHandler)],
										 debug=True)
	util.run_wsgi_app(application)


if __name__ == '__main__':
	main()

