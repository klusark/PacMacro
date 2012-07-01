#pragma once

#include <string>
#include "Player.hpp"
#include <Poco/Mutex.h>

class Game {
public:
	Game();
	std::string getGameState(PlayerType id);
	void addConnection(PlayerType id, Connection *connection);
	void removeConnection(PlayerType id, Connection *connection);
	void moveTo(PlayerType id, int pos);
private:
	static const int _numTiles = 152;
	bool _tiles[_numTiles];
	bool _ghostTiles[_numTiles];
	int _gameLength;
	int _startTime;
	Player _players[5];
	int _score;

	Poco::FastMutex mutex;
};

extern Game *g_game;
