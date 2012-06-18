#pragma once

#include <vector>

enum PlayerType {
	Pacman,
	Inky,
	Blinky,
	Pinky,
	Clyde,
	InvalidType
};

std::ostream &operator<<(std::ostream &os, PlayerType const&type);

class Connection;

class Player {
public:
	Player();

	void send(const std::string &data);

	PlayerType getType() { return _type; }
	void setType(PlayerType type) { _type = type; }
	int getPos() { return _pos; }
	void setPos(int pos) { _pos = pos; }

	void addConnection(Connection *connection);
	void removeConnection(Connection *connection);
private:
	
	std::vector<Connection *> _connections;
	bool _isLoggedIn;
	PlayerType _type;

	int _pos;
};
