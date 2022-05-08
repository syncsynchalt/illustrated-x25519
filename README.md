# X25519 Key Exchange

Published at https://x25519.ulfheim.net

- `site/`: page source for the finished product
- `js/`: javascript (not site-specific)
- `js/test/`: test code for javascript
- `plots/`: gnuplot graph builders

### Deploy instructions


```
make test
make
rsync -avh site/ host:/path/to/www
```
