from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext import db
from google.appengine.api import channel
from google.appengine.api import users

class User(db.Model):
	user = db.UserProperty()
	game = db.Key()


class Game(db.Model):
	name = db.StringProperty(required=True)
	owner = db.UserProperty()


class LoginHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		if user:
			response = "Yes"
		else:
			response = users.create_login_url("/")
		
		self.response.out.write(response)
		
class ConnectHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		
		token = channel.create_channel(user.user_id())
		response = "{\"token\":\""+token+"\",\"games\":["
		q = Game.all()
		games = q.fetch(10)
		
		for game in games:
			response = response + game.name + ","
		response = response + "]}"
		self.response.out.write(response)

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

class GetGameListHandler(webapp.RequestHandler):
	def get(self):
		q = Game.all()
		games = q.fetch(10);
		
		response = "{\"game\":[\"\""
		
		for game in games:
			response = response + ",\"" + game.name +"\"" 
		response = response + "]}"
		self.response.out.write(response)

def main():
	application = webapp.WSGIApplication([('/login', LoginHandler), ('/connect', ConnectHandler), ('/creategame', CreateGameHandler), ('/getgamelist', GetGameListHandler)],
										 debug=True)
	util.run_wsgi_app(application)


if __name__ == '__main__':
	main()
