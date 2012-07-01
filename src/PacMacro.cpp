#include "Poco/Net/HTTPServer.h"
#include "Poco/Net/HTTPRequestHandler.h"
#include "Poco/Net/HTTPRequestHandlerFactory.h"
#include "Poco/Net/HTTPServerParams.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTTPServerParams.h"
#include "Poco/Net/ServerSocket.h"
#include "Poco/Net/WebSocket.h"
#include "Poco/Net/NetException.h"
#include "Poco/Util/ServerApplication.h"

#include "Player.hpp"
#include "Game.hpp"
#include "Connection.hpp"

class WebSocketRequestHandler: public Poco::Net::HTTPRequestHandler {
public:
	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse &response);
};

class RequestHandlerFactory: public Poco::Net::HTTPRequestHandlerFactory {
public:
	Poco::Net::HTTPRequestHandler *createRequestHandler(const Poco::Net::HTTPServerRequest &request);
};

void WebSocketRequestHandler::handleRequest(Poco::Net::HTTPServerRequest &request, Poco::Net::HTTPServerResponse &response) {
	try {
		Poco::Net::WebSocket *ws = new Poco::Net::WebSocket(request, response);
		Connection *player = new Connection(ws);
	} catch (Poco::Net::WebSocketException& exc) {
		switch (exc.code()) {
		case Poco::Net::WebSocket::WS_ERR_HANDSHAKE_UNSUPPORTED_VERSION:
			response.set("Sec-WebSocket-Version", Poco::Net::WebSocket::WEBSOCKET_VERSION);
			// fallthrough
		case Poco::Net::WebSocket::WS_ERR_NO_HANDSHAKE:
		case Poco::Net::WebSocket::WS_ERR_HANDSHAKE_NO_VERSION:
		case Poco::Net::WebSocket::WS_ERR_HANDSHAKE_NO_KEY:
			response.setStatusAndReason(Poco::Net::HTTPResponse::HTTP_BAD_REQUEST);
			response.setContentLength(0);
			response.send();
			break;
		}
	}
}

Poco::Net::HTTPRequestHandler* RequestHandlerFactory::createRequestHandler(const Poco::Net::HTTPServerRequest &request) {
	if (request.getURI() == "/")
		return new WebSocketRequestHandler;
	else
		return nullptr;
}

class WebSocketServer: public Poco::Util::ServerApplication {
protected:
	int main(const std::vector<std::string>& args) {
		g_game = new Game();

		// set-up a server socket
		Poco::Net::ServerSocket svs(37645);
		// set-up a HTTPServer instance
		Poco::Net::HTTPServer srv(new RequestHandlerFactory, svs, new Poco::Net::HTTPServerParams);
		// start the HTTPServer
		srv.start();
		// wait for CTRL-C or kill
		waitForTerminationRequest();
		// Stop the HTTPServer
		srv.stop();
		return Application::EXIT_OK;
	}

};

POCO_SERVER_MAIN(WebSocketServer)
