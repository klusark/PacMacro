#pragma once

#include <string>
#include "Player.hpp"

class Game {
public:
	Game();
	std::string getGameState();
	void addConnection(PlayerType id, Connection *connection);
	void removeConnection(PlayerType id, Connection *connection);
	void moveTo(PlayerType id, int pos);
private:
	static const int _numTiles = 152;
	bool _tiles[_numTiles];
	int _gameLength;
	int _startTime;
	Player _players[5];
	int _score;

};

extern Game *g_game;
