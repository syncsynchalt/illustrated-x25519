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
        return BigInt(`0x${nString}`);
    }

    /**
     * Setter for privkey input.
     * @param n {BigInt}
     */
    function setPubkeyPrivkey(n) {
        let input = document.getElementById('pubkey-privkey');
        input.value = n.toString(16);
    }

    function calcPubkey() {
        let result = document.getElementById('pubkey-result');
        let explainer = document.getElementById('pubkey-explainer');
        let n = getPubkeyPrivkey();
        if (n) {
            const nn = n % 2n ** 256n;
            if (n !== nn) {
                n = nn;
                setPubkeyPrivkey(n);
            }
        }
        if (!n) {
            explainer.classList.add('hidden');
            result.value = 'N/A';
            return;
        }
        explainer.classList.remove('hidden');
        let humanN = `${n}`;
        if (humanN.length > 13) {
            humanN = `${humanN.substring(0, 10)}...`;
        }
        document.getElementById('pubkey-explainer-num').innerText = `${humanN}P`;
        // xxx todo - set form error if throw here
        let {x, z} = curve.pointMult(9n, n);
        let pubkey = curve.X(x, z);
        result.value = field.toHex(pubkey, 256);
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

    function addMask() {
        let n = getPubkeyPrivkey();
        if (!n) {
            n = 0n;
        }
        n %= 2n**256n;
        n &= 2n**255n-8n;
        n |= 1n << 254n;
        setPubkeyPrivkey(n);
        calcPubkey();
    }

    function calcMult() {
        let result = document.getElementById('mult-result');
        result.value = 'N/A';
        let strN = document.getElementById('mult-n').value;
        let strPoint = document.getElementById('mult-point').value;
        if (!strN || !strPoint) {
            return;
        }
        let n = BigInt(`0x${strN}`);
        let point = BigInt(`0x${strPoint}`);
        if (!n || !point) {
            return;
        }
        n %= 256n;
        point %= field.p;
        let { x, z } = curve.pointMult(point, n);
        let X = curve.X(x, z);
        result.value = field.toHex(X, 256);
    }

    /**
     * @param el {HTMLInputElement} input element
     */
    function addCharsFilter(el) {
        const chars = el.getAttribute('data-chars');
        let prevOninput = el.oninput;
        el.oninput = (event) => {
            el.value = el.value.replaceAll(RegExp(`[^${chars}]`, 'g'), '');
            if (prevOninput) {
                prevOninput(event);
            }
        }
    }

    function onload() {
        document.getElementById('pubkey-privkey').oninput = calcPubkey;
        document.getElementById('pubkey-plus-one').onclick = plusOne;
        document.getElementById('pubkey-double').onclick = double;
        document.getElementById('pubkey-mask').onclick = addMask;
        document.getElementById('mult-n').oninput = calcMult;
        document.getElementById('mult-point').oninput = calcMult;

        const els = document.querySelectorAll('input[data-chars]');
        els.forEach((el) => {
            addCharsFilter(el);
        });
        calcPubkey();
    }
    if (document.readyState === 'complete') {
        onload();
    } else {
        window.onload = onload;
    }
})();
