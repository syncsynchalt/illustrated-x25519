IMAGES=curve25519-real.png curve25519-field.png
all: $(IMAGES) crush dist

curve25519-real.png: curve25519-real.gnuplot
	gnuplot $^ > $@

curve25519-field.png: curve25519-field.gnuplot
	gnuplot $^ > $@

curve25519-field.gnuplot: curve25519-field.py
	./$^ 2000 > $@

crush: $(IMAGES)
	for i in $(IMAGES); do \
		pngcrush "$$i" "$$i.out" && mv "$$i.out" "$$i"; \
	done

dist: $(IMAGES)
	mv $(IMAGES) ../site/images/

clean:
	rm -f curve25519-real.png curve25519-field.png curve25519-field.gnuplot

.PHONY: clean all crush
