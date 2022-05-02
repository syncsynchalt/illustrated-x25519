/**
 * Math library over the field Fp where p = 2^255-19.
 *
 * Not cryptographically safe, due to use of BigInt which is not time-constant.
 */

let p = 2n ** 255n - 19n;

/**
 * Returns a three-tuple (gcd, x, y) such that
 * a * x + b * y == gcd, where gcd is the greatest
 * common divisor of a and b.
 *
 * This function implements the extended Euclidean
 * algorithm and runs in O(log b) in the worst case.
 *
 * @param {BigInt} a
 * @param {BigInt} b
 * @returns {{gcd: BigInt, x: BigInt, y: BigInt}} containing GCD and x,y such that a*x + b*y == gcd
 */
function extended_euclidean_algorithm(a, b) {
    let s = 0n, old_s = 1n;
    let t = 1n, old_t = 0n;
    let r = b, old_r = a;
    let tmp = undefined;

    while (r !== 0n) {
        let quotient = old_r / r;

        tmp = old_r - (quotient * r);
        old_r = r;
        r = tmp;
        tmp = old_s - (quotient * s);
        old_s = s;
        s = tmp;
        tmp = old_t - (quotient * t);
        old_t = t;
        t = tmp;
    }
    return {
        gcd: old_r,
        x: old_s,
        y: old_t
    };
}


/**
 * @param {BigInt} n
 * @return {BigInt}
 */
function square(n) {
    return n * n;
}


/**
 * Reduce a number to modulo p (into the positive range of this field).
 * @param {BigInt} n
 * @return {BigInt} result
 */
function reduce(n) {
    n %= p;
    if (n < 0) {
        n += p;
    }
    return n;
}

/**
 * Returns the multiplicative inverse of n modulo p.
 *
 * @param {BigInt} n
 * @returns {BigInt} m such that (n * m) % p == 1.
 */
function inverseOf(n) {
    if (n === 0n) {
        throw Error('Illegal argument zero');
    }
    // noinspection JSUnusedLocalSymbols
    let { _gcd, x, _y } = extended_euclidean_algorithm(n, p);
    return reduce(x);
}

/**
 * Return the bignum as a hex string, padded with zeros.
 * @param {BigInt} a
 * @param {Number=} bits number of bits output to zero-pad to (rounded up to 8-boundary)
 * @return {string}
 */
function toHex(a, bits) {
    bits = Number(bits || 0);
    let nibbles = 2 * Math.floor((bits+7)/8);
    let result = a.toString(16);
    if (result.length < nibbles) {
        result = '0'.repeat(nibbles-result.length) + result;
    }
    return result;
}

/**
 * Given a hex string reverse its endianness, e.g. "abcdef" => "efcdab"
 * @param s {String} hex string
 * @return {String} flipped result
 */
function hexFlipEndian(s) {
    return s.match(/../g).reverse().join('');
}

export {
    square,
    reduce,
    inverseOf,
    toHex,
    hexFlipEndian,
    p
};
