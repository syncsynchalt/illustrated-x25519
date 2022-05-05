all: site-prep

site-prep:
	cp -a js/*.js site/
	sed -i '' -re 's/bustin=[0-9]*/bustin='$$(date +%s)'/g' site/*.js site/*.html

test:
	cd js && npm test

.PHONY: site-prep test
