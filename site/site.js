(async () => {
    let curve = await import('./curve.js');
    let field = await import('./field.js');

    /**
     * Getter for privkey input.
     * @return {BigInt|undefined}
     */
    function getPubkeyPrivkey() {
        let input = document.getElementById('pubkey-privkey');
        let nString = input.value;
        if (nString.match(/^0*$/)) {
            return undefined;
        }
        let v = BigInt(nString);
        return v ? v : undefined;
    }

    /**
     * Setter for privkey input.
     * @param n {BigInt}
     */
    function setPubkeyPrivkey(n) {
        let input = document.getElementById('pubkey-privkey');
        input.value = `0x${n.toString(16)}`;
    }

    function calcPubkey() {
        let result = document.getElementById('pubkey-result');
        try {
            let n = getPubkeyPrivkey();
            if (n) {
                const nn = n % 2n ** 255n;
                if (n !== nn) {
                    n = nn;
                    setPubkeyPrivkey(n);
                }
            }
            if (!n) {
                result.value = 'N/A';
                return;
            }
            let { x, z } = curve.pointMult(9n, n);
            let pubkey = curve.X(x, z);
            result.value = `0x${field.toHex(pubkey, 256)}`;
        } catch (e) {
            result.value = `Error: ${e}`;
        }
    }

    function plusOne() {
        let n = getPubkeyPrivkey();
        if (!n) {
            n = 0n;
        }
        setPubkeyPrivkey(n + 1n);
        calcPubkey();
    }

    function double() {
        let n = getPubkeyPrivkey();
        if (!n) {
            n = 1n;
        } else {
            n *= 2n;
        }
        setPubkeyPrivkey(n);
        calcPubkey();
    }

    function addClamp() {
        let n = getPubkeyPrivkey();
        if (!n) {
            n = 0n;
        }
        n %= 2n**255n;
        n &= 2n**255n-8n;
        n |= 1n << 254n;
        setPubkeyPrivkey(n);
        calcPubkey();
    }

    function calcMult() {
        let result = document.getElementById('mult-result');
        try {
            result.value = 'N/A';
            let strN = document.getElementById('mult-n').value;
            let strPoint = document.getElementById('mult-point').value;
            if (!strN || !strPoint) {
                return;
            }
            let n = BigInt(strN);
            let point = BigInt(strPoint);
            if (!n || !point) {
                return;
            }
            n %= 255n;
            point %= field.p;
            let { x, z } = curve.pointMult(point, n);
            let X = curve.X(x, z);
            result.value = `0x${field.toHex(X, 256)}`;
        } catch (e) {
            result.value = `Error: ${e}`;
        }
    }

    function calcY() {
        let y1result = document.getElementById('xy-y1');
        let y2result = document.getElementById('xy-y2');
        try {
            y1result.value = 'N/A';
            y2result.value = 'N/A';
            let x = BigInt(document.getElementById('xy-x').value || '0x0');
            x %= field.p;
            let [ y1, y2 ] = curve.Y(x);
            y1result.value = `0x${field.toHex(y1)}`;
            y2result.value = `0x${field.toHex(y2)}`;
        } catch (e) {
            if (console) {
                console.error(e);
            }
            y1result.value = e.message;
            y2result.value = e.message;
        }
    }

    /**
     * @param el {HTMLInputElement} input element
     */
    function addHexFilter(el) {
        let prevOninput = el.oninput;
        el.oninput = (event) => {
            let v = el.value.replaceAll(/(^0*|[^a-f\d])/ig, '');
            if (v) {
                v = `0x${v}`;
            }
            el.value = v;
            if (prevOninput) {
                prevOninput(event);
            }
        }
    }

    function onload() {
        document.getElementById('pubkey-privkey').oninput = calcPubkey;
        document.getElementById('pubkey-plus-one').onclick = plusOne;
        document.getElementById('pubkey-double').onclick = double;
        document.getElementById('pubkey-clamp').onclick = addClamp;
        document.getElementById('mult-n').oninput = calcMult;
        document.getElementById('mult-point').oninput = calcMult;
        document.getElementById('xy-x').oninput = calcY;

        const els = document.querySelectorAll('input[data-deco=hex-ify]');
        els.forEach((el) => {
            addHexFilter(el);
        });
        calcPubkey();
    }
    if (document.readyState === 'complete') {
        onload();
    } else {
        window.onload = onload;
    }
})();
