all: site-prep

site-prep:
	cp -a js/*.js site/
	sed -i '' -re 's/bustin=[0-9]*/bustin='$$(date +%s)'/g' site/*.js site/*.html

test:
	cd js && npm test

dist:
	@if [[ -z "${site}" ]]; then echo "Must set \$$site"; exit 1; fi
	rsync -avh site/ ${site}

.PHONY: site-prep test
