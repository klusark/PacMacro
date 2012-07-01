#include <sstream>
#include <ctime>
#include "Game.hpp"
#include "Player.hpp"

Game *g_game = nullptr;

Game::Game() {
	for (int i = 0; i < _numTiles; ++i) {
		_tiles[i] = false;
		_ghostTiles[i] = false;
	}
	for (int i = 0; i < 5; ++i) {
		_players[i].setType((PlayerType)i);
	}
	_gameLength = 30;
	_startTime = (int)time(nullptr);
	_score = 0;
}

void Game::addConnection(PlayerType id, Connection *connection) {
	Poco::FastMutex::ScopedLock lock(mutex);
	_players[id].addConnection(connection);
}

void Game::removeConnection(PlayerType id, Connection *connection) {
	Poco::FastMutex::ScopedLock lock(mutex);
	_players[id].removeConnection(connection);
}

std::string Game::getGameState(PlayerType id) {
	Poco::FastMutex::ScopedLock lock(mutex);

	std::stringstream ss;
	ss << "{\"type\":\"full\",\"gamelength\":" << _gameLength << ",\"startTime\":" << _startTime 
	   << ",\"score\":" << _score << ",\"tiles\":[";
	bool first = true;
	bool *tiles = nullptr;
	if (id == Pacman) {
		tiles = _tiles;
	} else {
		tiles = _ghostTiles;
	}
	for (int i = 0; i < _numTiles; ++i) {
		if (tiles[i]) {
			if (!first) {
				ss << ",";
			}
			first = false;
			ss << i ;
		}
	}
	ss << "],\"powerPillActive\":false,\"players\":[";
	first = true;
	for (int i = 0; i < 5; ++i) {
		if ((id != Pacman && _players[i].getType() != Pacman) || id == Pacman) {
			if (!first) {
				ss << ",";
			}
			first = false;
			ss << "{\"role\":\"" << _players[i].getType() << "\",\"pos\":" << _players[i].getPos() << "}";
		}
	}
	ss << "]}";
	return ss.str();
}

void Game::moveTo(PlayerType id, int pos) {
	Poco::FastMutex::ScopedLock lock(mutex);

	std::stringstream ss;
	if (id == Pacman) {
		if (_tiles[pos] == false) {
			_score += 10;
		}
		_tiles[pos] = true;
	}
	_players[id].setPos(pos);
	ss << "{\"type\":\"move\",\"pos\":" << pos << ",\"role\":\"" << id << "\",\"score\":" << _score <<"}";
	std::string str = ss.str();
	for (int i = 0; i < 5; ++i) {
		if ((id == Pacman && _players[i].getType() == Pacman) || id != Pacman) {
			_players[i].send(str);
		}
	}
}
