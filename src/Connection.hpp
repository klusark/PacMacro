#pragma once

#include "Poco/Runnable.h"
#include "Poco/Thread.h"
#include "Poco/Net/WebSocket.h"

#include "Player.hpp"

class Connection : public Poco::Runnable {
public:
	Connection(Poco::Net::WebSocket *ws);
	void run();

	void send(const std::string &data);

private:
	
	Poco::Net::WebSocket *_ws;
	Poco::Thread _thread;
	int _flags;
	PlayerType _type;
};
