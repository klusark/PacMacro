
#include <iostream>


#include "Player.hpp"
#include "Game.hpp"
#include "Connection.hpp"

std::vector<Player *> players;

std::ostream &operator<<(std::ostream &os, PlayerType const&type) {
	switch (type) {
	case Pacman:
		os << "Pacman";
		break;
	case Inky:
		os << "Inky";
		break;
	case Blinky:
		os << "Blinky";
		break;
	case Pinky:
		os << "Pinky";
		break;
	case Clyde:
		os << "Clyde";
		break;
	}
	return os;
}

Player::Player() : _type(InvalidType), _pos(0) {

}

void Player::addConnection(Connection *connection) {
	_connections.push_back(connection);
}

void Player::removeConnection(Connection *connection) {
	for (auto it = _connections.begin(); it != _connections.end(); ++it) {
		if (*it == connection) {
			_connections.erase(it);
			return;
		}
	}
}

void Player::send(const std::string &data) {
	for (Connection *x : _connections) {
		x->send(data);
	}

}