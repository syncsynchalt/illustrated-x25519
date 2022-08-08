all: site-prep

site-prep:
	cp -a js/*.js site/
	sed -i '' -re 's/bustin=[0-9]*/bustin='$$(date +%s)'/g' site/*.js site/*.html

test:
	cd js && npm test

dist:
	@if [[ -z "${DISTROOT}" ]]; then echo "Must set \$$DISTROOT variable"; exit 1; fi
	rsync -rlpvhc site/ ${DISTROOT}/x25519/

.PHONY: site-prep test
