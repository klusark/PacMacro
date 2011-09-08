from google.appengine.api import channel
from gaesessions import get_current_session
from google.appengine.ext import db, webapp
from google.appengine.ext.webapp import util
from datetime import datetime

class Game(db.Model):
	name = db.StringProperty(required=True)
	owner = db.ReferenceProperty()
	players = db.ListProperty(db.Key)
	started = db.BooleanProperty()
	ended = db.BooleanProperty()
	score = db.IntegerProperty()
	eaten = db.ListProperty(int)
	eatenPowerPill = db.ListProperty(int)
	powerPillActive = db.BooleanProperty()
	powerPillStartTime = db.DateTimeProperty()
	startTime = db.DateTimeProperty()
	numEaten = db.IntegerProperty()
	gameLength = db.IntegerProperty()
	def CheckPowerPill(self):
		if self.powerPillActive:
			time = datetime.utcnow()
			delta = time - self.powerPillStartTime
			if delta.seconds > 120:
				self.powerPillActive = False
				self.put()
	def CheckGameEnd(self):
		time = datetime.utcnow()
		delta = time - self.powerPillStartTime
		if delta.seconds > self.gameLength*60:
			self.ended = True
			self.put()
class User(db.Model):
	username = db.StringProperty()
	password = db.StringProperty()
	game = db.ReferenceProperty(Game)
	role = db.StringProperty()
	pos = db.IntegerProperty()
	dead = db.BooleanProperty()

def IsRoleGood(role):
	return True

def GetSessionUser():
	session = get_current_session()
	user = None
	if session.is_active():
		key = session.get("key")
		user = User.get(key)
	session.regenerate_id()
	return user

class LogoutHandler(webapp.RequestHandler):
	def get(self):
		session = get_current_session()
		session.terminate()
		self.response.out.write(GetLoginStatus(None))
	
def GetLoginStatus(user):
	response = '{"loggedin":'
	if user:
		response += 'true,"ingame":'
		#TODO: Check if the game is actually valid as it will crash if it is not.
		if user and user.game:
			response += 'true,"started":'
			if user.game.started:
				response += "true"
			else:
				response += "false"
		else:
			response += "false"

	else:
		response += 'false'
	response += "}"
	return response

class LoginHandler(webapp.RequestHandler):
	def get(self):
		user = GetSessionUser()
		uname = self.request.get("user")
		upass = self.request.get("pass")
		if uname and upass:
			q = User.all()

			q.filter("username", uname)
			users = q.fetch(1)
			if not users:
				self.response.out.write("Could not find user")
				return
			u = users[0]
			session = get_current_session()
			session.set_quick("key", u.key())
			user = u

		self.response.out.write(GetLoginStatus(user))

class SignupHandler(webapp.RequestHandler):
	def get(self):
		uname = self.request.get("user")
		upass = self.request.get("pass")

		q = User.all()

		q.filter("username", uname)
		users = q.fetch(1)
		if users:
			self.response.out.write("User already exists with that name")
			return

		u = User(username=uname, password=upass, role="None")
		u.put()
		session = get_current_session()
		session.set_quick("key", u.key())
		self.response.out.write(GetLoginStatus(u))

class ConnectHandler(webapp.RequestHandler):
	def get(self):
		session = get_current_session()
		key = session.get("key")

		token = channel.create_channel(str(key.id()))
		self.response.out.write(token)

class CreateGameHandler(webapp.RequestHandler):
	def get(self):
		user = GetSessionUser()
		q = Game.all()

		name = self.request.get("name")
		q.filter("name", name)
		games = q.fetch(1)
		if (games):
			self.response.out.write("Game already exists with that name")
		else:
			game = Game(name=name, owner=user, powerPillActive=False, started=False, score=0, numEaten=0, gameLength=30)
			game.players.append(user.key())
			game.put()
			user.game = game
			user.put()

class GetGameListHandler(webapp.RequestHandler):
	def get(self):
		q = Game.all()
		games = q.fetch(10)

		response = '{"game":['
		empty = True
		for game in games:
			if not game.started:
				response += '"%s",' % game.name
				empty = False
		if not empty:
			response = response[:-1]
		response += "]}"
		self.response.out.write(response)

class JoinGameHandler(webapp.RequestHandler):
	def get(self):
		user = GetSessionUser()
		q = Game.all()
		name = self.request.get("name")
		q.filter("name", name)
		response = "{}"
		game = q.fetch(1)
		if game and game[0]:
			g = game[0]
			if len(g.players) < 5:
				for player in g.players:
					channel.send_message(str(player.id()), '{"type":"playerjoin","player":{"name":"%s", "role":"%s"}}' % (user.username, user.role))
				g.players.append(user.key())
				g.put()
				user.game = g
				user.put()
			else:
				response = '{"error":"game full"}'
		else:
			response = '{"error":"game not found"}'
		self.response.out.write(response)

class LeaveGameHandler(webapp.RequestHandler):
	def get(self):
		user = GetSessionUser()
		if not user or user.game.started:
			return
		if user == user.game.owner:
			for player in user.game.players:
				p = User.get(player)
				p.game = None
				p.put()
				channel.send_message(player.user_id(), '{"type":"gameend"}')
			user.game.delete()
		elif user in user.game.players:
			user.game.players.remove(user.key())
			for player in user.game.players:
				channel.send_message(player.user_id(), '{"type":"playerleave","player":"%s"}' % user.nickname())
			user.game.put()
		user.game = None
		user.put()

class GameInfoHandler(webapp.RequestHandler):
	def get(self):
		user = GetSessionUser()
		if not user or not user.game:
			return
		if user.game.started:
			user.game.CheckPowerPill()
			response = '{"type":"full","gamelength":"%s","startTime":"%s","score":"%s","tiles":[' % (user.game.gameLength, user.game.startTime, user.game.score)
			if user.role == "Pacman":
				if user.game.eaten:
					for i in user.game.eaten:
						response += '"%s",' % i
					response = response[:-1]
			else:
				if user.game.eatenPowerPill:
					for i in user.game.eatenPowerPill:
						response += '"%s",' % i
					response = response[:-1]

			response += '],"powerPillActive":'
			if user.game.powerPillActive:
				response += 'true,"powerPillStart":"%s"' % user.game.powerPillStartTime
			else:
				response += 'false'
		else:
			response = '{"type":"full","creator":'

			if user.game.owner.key() == user.key():
				response += "true"
			else:
				response += "false"
		response += ',"players":['
		localPlayer = -1
		i = 0
		for player in user.game.players:
			if player == user.key():
				localPlayer = i
			p = User.get(player)
			pos = p.pos
			if p.role == "Pacman" and user.role != "Pacman" and not user.game.powerPillActive:
				pos = -1
			response += '{"name":"%s","role":"%s","pos":"%s"},' % (p.username, p.role, pos)
			i += 1
		response = response[:-1]
		response += '],"localPlayer":"%s"}' % localPlayer
		self.response.out.write(response)

class UpdateSettingsHandler(webapp.RequestHandler):
	def get(self):
		user = GetSessionUser()
		role = self.request.get("role")
		gameLength = self.request.get("length")
		if role:
			if not IsRoleGood(role):
				return
			if not user:
				return
	
			for player in user.game.players:
				channel.send_message(str(player.id()), '{"type":"player","player":{"name":"%s", "role":"%s"}}' % (user.username, role))
	
			user.role = role
			user.put()
		if gameLength:
			user.game.gameLength = int(gameLength)
			user.game.put()
			for player in user.game.players:
				channel.send_message(str(player.id()), '{"type":"length","length":"%s"}' % gameLength)

class StartGameHandler(webapp.RequestHandler):
	def get(self):
		user = GetSessionUser()
		if not user:
			return

		#TODO: make sure the game is actually valid to start.
		user.game.started = True
		user.game.startTime = datetime.utcnow()
		user.game.eaten.append(0)
		user.game.put()
		for player in user.game.players:
			p = User.get(player)
			if p.role != "Pacman":
				p.pos = 39
			else:
				p.pos = 0
			p.put()
			channel.send_message(str(player.id()), '{"type":"startgame"}')

class MoveToHandler(webapp.RequestHandler):
	def get(self):
		user = GetSessionUser()
		if not user:
			return
		#TODO: remove this.
		u = user
		putGame = False

		poss = self.request.get("pos")
		pos = int(poss)
		u.pos = pos
		u.put()
		message = '{"type":"move","pos":"%s","name":"%s","role":"%s"' % (poss, user.username, u.role)
		u.game.CheckPowerPill()
		if u.role == "Pacman" and not pos in u.game.eaten:
			u.game.eaten.append(pos)

			message += ',"eat":"true"'
			if pos in [19, 28, 51, 60]:
				u.game.powerPillActive = True
				u.game.powerPillStartTime = datetime.utcnow()
				u.game.numEaten = 0
				u.game.score += 50
			else:
				u.game.score += 10
			putGame = True

		if u.game.powerPillActive and not pos in u.game.eatenPowerPill:
				u.game.eatenPowerPill.append(pos)

		if putGame:
			u.game.put()
		message += ',"score":"%s","powerPillActive":' % u.game.score
		if u.game.powerPillActive:
			message += 'true,"powerPillStart":"%s"' % u.game.powerPillStartTime
		else:
			message += 'false'
		message += "}"
		self.response.out.write(message)
		if u.role == "Pacman" and not u.game.powerPillActive:
			return
		for player in u.game.players:
			if player != u.key():
				channel.send_message(str(player.id()), message)

class EatenHandler(webapp.RequestHandler):
	def get(self):
		user = GetSessionUser()
		user.game.CheckPowerPill()
		if user.role == "Pacman" and not user.game.powerPillActive:

			pass #end the game
		elif user.game.powerPillActive and not user.dead:
			user.game.numEaten += 1
			user.game.score += 100 * user.game.numEaten
			user.game.put()
			user.dead = True;
			user.put()
		message = '{"type":"score","score":"%s"}' % user.game.score
		for player in user.game.players:
			channel.send_message(str(player.id()), message)

def main():
	application = webapp.WSGIApplication([
										('/login', LoginHandler),
										('/logout', LogoutHandler),
										('/signup', SignupHandler),
										('/connect', ConnectHandler),
										('/creategame', CreateGameHandler),
										('/getgamelist', GetGameListHandler),
										('/joingame', JoinGameHandler),
										('/getgameinfo', GameInfoHandler),
										('/leavegame', LeaveGameHandler),
										('/updatesettings', UpdateSettingsHandler),
										('/startgame', StartGameHandler),
										('/eaten', EatenHandler),
										('/moveto', MoveToHandler)],
										 debug=True)
	util.run_wsgi_app(application)


if __name__ == '__main__':
	main()

