all:
	cp -a js/*.js site/

test:
	cd js && npm test
