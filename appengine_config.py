from gaesessions import SessionMiddleware
def webapp_add_wsgi_middleware(app):
	app = SessionMiddleware(app, cookie_key='\xbc\x8be\xfa\xf8x\xf3\xc7]c\xa1\x99\xbb\xb5\x01\xa3uO<\r\xecUC&l`OP\xbdB\xcb\xb6&\x07/#\x10\xe9\xbb;\x06K\x9c*g\x1bT,\xb3`\xb0\xd4\xbb<\xb8\xc7R~\xd0\x1f^\xe1G\x0b')
	return app