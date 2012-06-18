#include "Poco/StringTokenizer.h"

#include "Connection.hpp"
#include "Player.hpp"
#include "Game.hpp"

Connection::Connection(Poco::Net::WebSocket *ws) : _ws(ws), _type(InvalidType) {
	_thread.start(*this);

}

void Connection::run() {
	char buff[1024];
	int length;
	for (;;) {
		try {
			length = _ws->receiveFrame(buff, 1024, _flags);
		} catch (Poco::TimeoutException &) {
			continue;
		}
		if (length == 0) {
			break;
		}
		buff[length] = 0;
		Poco::StringTokenizer token(buff, ";");
		if (token.count() != 2) {
			break;
		}
		if (token[0] == "login") {
			if (token[1] == "pacman") {
				_type = Pacman;
			} else if (token[1] == "inky") {
				_type = Inky;
			} else if (token[1] == "blinky") {
				_type = Blinky;
			} else if (token[1] == "pinky") {
				_type = Pinky;
			} else if (token[1] == "clyde") {
				_type = Clyde;
			} else {
				break;
			}
			g_game->addConnection(_type, this);
			send(g_game->getGameState());
		} else if (token[0] == "moveto") {
			int pos = atoi(token[1].c_str());
			g_game->moveTo(_type, pos);
		}
	}
	if (_type != InvalidType) {
		g_game->removeConnection(_type, this);
	}
	delete _ws;
	delete this;
}

void Connection::send(const std::string &data) {
	_ws->sendFrame(data.c_str(), data.length(), _flags); 
}