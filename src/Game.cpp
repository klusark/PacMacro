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
		if (i != Pacman) {
			_players[i].setPos(39);
		}
	}
	_gameLength = 30;
	_startTime = (int)time(nullptr);
	_score = 0;
	_powerPillActive = false;
	_gameOver = false;
}

void Game::addConnection(PlayerType id, Connection *connection) {
	Poco::FastMutex::ScopedLock lock(mutex);
	_players[id].addConnection(connection);
}

void Game::removeConnection(PlayerType id, Connection *connection) {
	Poco::FastMutex::ScopedLock lock(mutex);
	_players[id].removeConnection(connection);
}

bool Game::isPowerPill(int pos) {
	if (pos == 19 || pos == 28 || pos == 51 || pos == 60) {
		return true;
	}
	return false;
}

std::string Game::getGameState(PlayerType id) {
	Poco::FastMutex::ScopedLock lock(mutex);

	checkTimes();

	int t = (int)time(nullptr);

	std::stringstream ss;
	ss << "{\"type\":\"full\",\"gamelength\":" << _gameLength << ",\"timeLeft\":" << (_startTime + 30*60) - t
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
	ss << "],\"powerPillActive\":" << _powerPillActive << "";

	if (_powerPillActive) {
		ss << ",\"powerPillLeft\":\"" << (_pillTime + 120) - t << "\"";
	}
	ss << ",\"players\":[";
	first = true;
	for (int i = 0; i < 5; ++i) {
		if (!first) {
			ss << ",";
		}
		first = false;
		if ((id != Pacman && _players[i].getType() != Pacman) || id == Pacman) {
			ss << "{\"role\":\"" << _players[i].getType() << "\",\"pos\":" << _players[i].getPos() << "}";
		} else {
			ss << "{\"role\":\"" << _players[i].getType() << "\",\"pos\":";
			if (_powerPillActive) {
				ss << _players[i].getPos();
			} else {
				ss << "-1";
			}
			ss << "}";
		}
	}
	ss << "]}";
	return ss.str();
}

void Game::checkTimes() {
	int t = (int)time(nullptr);
	if (_powerPillActive && t - 120 > _pillTime) {
		_powerPillActive = false;
	}

	if (t - 60 * _gameLength  > _startTime) {
		_gameOver = true;
	}
}

void Game::moveTo(PlayerType id, int pos) {
	Poco::FastMutex::ScopedLock lock(mutex);

	checkTimes();

	if (_gameOver) {
		return;
	}

	std::stringstream ss, ss2;
	if (id == Pacman && !isPowerPill(pos)) {
		if (_tiles[pos] == false) {
			_score += 10;
		}
		_tiles[pos] = true;
		if (_powerPillActive) {
			_ghostTiles[pos] = true;
		}
	}
	_players[id].setPos(pos);
	ss << "{\"type\":\"move\",\"pos\":" << pos << ",\"role\":\"" << id << "\",\"score\":" << _score << "}";
	ss2 << "{\"type\":\"score\",\"score\":" << _score << "}";
	std::string str = ss.str();
	std::string str2 = ss2.str();
	for (int i = 0; i < 5; ++i) {
		if (((id == Pacman && _players[i].getType() == Pacman) || id != Pacman) || _powerPillActive) {
			_players[i].send(str);
		} else {
			_players[i].send(str2);
		}
	}
}

void Game::power(int pos) {
	Poco::FastMutex::ScopedLock lock(mutex);

	checkTimes();

	if (_gameOver) {
		return;
	}

	std::stringstream ss;

	if (_tiles[pos] == false) {
		_score += 100;
	} else {
		return;
	}
	_tiles[pos] = true;
	_ghostTiles[pos] = true;

	_pillTime = (int)time(nullptr);
	_powerPillActive = true;

	ss << "{\"type\":\"power\",\"pos\":" << pos << ",\"score\":" << _score << ",\"time\":\"" << _pillTime << "\"}";

	std::string str = ss.str();
	for (int i = 0; i < 5; ++i) {
		_players[i].send(str);
	}
}
