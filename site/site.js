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
        if (!n) {
            explainer.classList.add('hidden');
            result.innerText = '';
            return;
        }
        explainer.classList.remove('hidden');
        document.getElementById('pubkey-explainer-num').innerText = n.toString();
        const nn = n % field.p;
        if (n !== nn) {
            n = nn;
            setPubkeyPrivkey(n);
        }
        // xxx todo - set form error if throw here
        // xxx todo - only allow valid chars
        let {x, z} = curve.pointMult(9n, n);
        let pubkey = curve.X(x, z);
        result.innerText = field.toHex(pubkey, 256);
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
