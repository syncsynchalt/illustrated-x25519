/**
 * Bigint library to handle numbers in the range 0..p where p=2**255-19.
 *
 * All math operations are reduced modulo p.
 *
 * Numbers are implemented as Uint32Array, with the array elements
 * treated in little-endian order. Clarity preferred over performance
 * or protection against timing attacks.
 */

let constants = {
    p: undefined,
    els: 16, // need at least 512 bits to support 256b*256b multiplication
    bitsPerEl: Uint32Array.BYTES_PER_ELEMENT * 8
};

/**
 * Create a new big number, with optional initial value in least 32 bits.
 * @param {Number} [initial]
 */
let num = (initial) => {
    initial ||= 0;
    let a = new Uint32Array(constants.els);
    a[0] = initial & 0xFFFFFFFF;
    return a;
};

// create the number 2*255-19:
// 7FFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF
// FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFED
let makeConstants = () => {
    constants.p = num();
    constants.p[0] = 0xFFFFFFED;
    for (let i = 1; i < 7; i++) {
        constants.p[i] = 0xFFFFFFFF;
    }
    constants.p[7] = 0x7FFFFFFF;
};
makeConstants();

let _add = (a, b) => {
    let c = num();
    let carry = 0;
    for (let i = 0; i < constants.els; i++) {
        c[i] = a[i] + b[i] + carry;
        let x1 = a[i] === 0xFFFFFFFF && carry !== 0;
        let x2 = b[i] === 0xFFFFFFFF && carry !== 0;
        let x3 = a[i] > c[i];
        let x4 = b[i] > c[i];
        carry = 0;
        if (x1) carry = 1;
        if (x2) carry = 1;
        if (x3) carry = 1;
        if (x4) carry = 1;
    }
    return c;
};

/**
 * Add two numbers together, modulo p
 * @param {Uint32Array} a
 * @param {Uint32Array} b
 * @returns {Uint32Array}
 */
let add = (a, b) => {
    let c = _add(a, b);
    return reduce(c);
};

/**
 * Reduce the number modulo p
 * @param {Uint32Array} a
 */
let reduce = (a) => {
    let discard = num();
    let window = 256;
    let mod = clone(constants.p);
    rotl(mod, window);
    for (let i = 0; i < window+1; i++) {
        let x = _sub(a, mod);
        if (compare(a, mod) >= 0) {
            a.set(x);
        } else {
            discard.set(x);
        }
        rotr(mod, 1);
    }
    return a;
};

let _sub = (a, b) => {
    while (compare(a, b) < 0) {
        a = _add(a, constants.p);
    }
    let c = num();
    let carry = 0;
    for (let i = 0; i < constants.els; i++) {
        c[i] = a[i] - b[i] - carry
        let x1 = b[i] > a[i];
        let x2 = b[i] === 0xFFFFFFFF && carry !== 0;
        let x3 = b[i]+carry > a[i];
        carry = 0;
        if (x1) carry = 1;
        if (x2) carry = 1;
        if (x3) carry = 1;
    }
    return c;
};

/**
 * Subtract b from a. Result is modulo p.
 * @param {Uint32Array} a
 * @param {Uint32Array} b
 */
let sub = (a, b) => {
    let c = _sub(a, b);
    return reduce(c);
};

/**
 * Return a new copy of number (so that you can modify it freely)
 * @param {Uint32Array} a
 * @returns {Uint32Array}
 */
let clone = (a) => {
    let b = num();
    b.set(a);
    return b;
};

let _mult = (a, b) => {
    a = clone(a);
    b = clone(b);
    let c = num();
    let _ = num();
    const bits = constants.els * Uint32Array.BYTES_PER_ELEMENT * 8;
    for (let i = 0; i < bits; i++) {
        let x = _add(c, b);
        // noinspection JSBitwiseOperatorUsage
        if (a[0] & 1) {
            c = x;
        } else {
            _ = x;
        }
        rotr(a, 1);
        rotl(b, 1);
    }
    return c;
};

/**
 * Multiply a and b. Result is modulo p.
 * @param {Uint32Array} a
 * @param {Uint32Array} b
 */
let mult = (a, b) => {
    let c = _mult(a, b);
    return reduce(c);
};

/**
 * Right-rotate the number a by n bits, in-place.
 * @param {Uint32Array} a the number to rotate
 * @param {Number} n the number of bits
 */
let rotr = (a, n) => {
    while (n >= constants.bitsPerEl) {
        for (let i = 0; i < constants.els-1; i++) {
            a[i] = a[i+1];
        }
        a[constants.els-1] = 0;
        n -= constants.bitsPerEl;
    }
    if (n === 0) {
        return a;
    }

    let carry = new Uint32Array(1);
    let new_carry = new Uint32Array(1);
    for (let i = constants.els-1; i >= 0; i--) {
        new_carry[0] = a[i] << (constants.bitsPerEl - n);
        a[i] >>>= n;
        a[i] |= carry[0];
        carry.set(new_carry);
    }
};

/**
 * Left-rotate the number a by n bits, in-place.
 * @param {Uint32Array} a the number to rotate
 * @param {Number} n the number of bits
 */
let rotl = (a, n) => {
    while (n >= constants.bitsPerEl) {
        for (let i = constants.els-2; i >= 0; i--) {
            a[i+1] = a[i];
        }
        a[0] = 0;
        n -= constants.bitsPerEl;
    }
    if (n === 0) {
        return a;
    }

    let carry = new Uint32Array(1);
    let new_carry = new Uint32Array(1);
    for (let i = 0; i < constants.els-1; i++) {
        new_carry[0] = a[i] >>> (constants.bitsPerEl - n);
        a[i] <<= n;
        a[i] |= carry[0];
        carry.set(new_carry);
    }
    return a;
};


/**
 * @param {Uint32Array} a
 * @param {number} n
 * @return {boolean}
 */
let nbit = (a, n) => {
    let i = 0;
    while (n >= constants.bitsPerEl) {
        i++;
        n -= constants.bitsPerEl;
    }
    return ((a[i] >> n) & 1) === 1;
};

let setBit = (a, n) => {
    let i = 0;
    while (n >= constants.bitsPerEl) {
        i++;
        n -= constants.bitsPerEl;
    }
    a[i] |= (1 << n);
};

/**
 * Returns the result of integer division of n by d.
 * @param {Uint32Array} n
 * @param {Uint32Array} d
 * @return {Uint32Array} result
 */
let idiv = (n, d) => {
    if (compare(d, num(0)) === 0) {
        throw 'Division by zero';
    }
    let q = num(0);
    let r = num(0);
    for (let i = constants.els * constants.bitsPerEl - 1; i >= 0; i--) {
        rotl(r, 1);
        r[0] |= (nbit(n, i) ? 1 : 0);
        if (compare(r, d) >= 0) {
            r = sub(r, d);
            setBit(q, i);
        }
    }
};

/**
 * Returns a three-tuple (gcd, x, y) such that
 * a * x + b * y == gcd, where gcd is the greatest
 * common divisor of a and b.
 *
 * This function implements the extended Euclidean
 * algorithm and runs in O(log b) in the worst case.
 *
 * @param {Uint32Array} a
 * @param {Uint32Array} b
 * @returns {object} containing "gcd", "x", and "y"
 */
let extended_euclidean_algorithm = (a, b) => {
    let s = num(0), old_s = num(1);
    let t = num(1), old_t = num(0);
    let r = clone(b), old_r = clone(a);
    const zero = num();
    let tmp = undefined;

    while (compare(r, zero) !== 0) {
        let quotient = idiv(old_r, r);

        tmp = sub(old_r, mult(quotient, r));
        old_r = r;
        r = tmp;
        tmp = sub(old_s, mult(quotient, s));
        old_s = s;
        s = tmp;
        tmp = sub(old_t, mult(quotient, t));
        old_t = t;
        t = tmp;
    }
    return {gcd: old_r, x: old_s, y: old_t};
}


/**
 * Returns the multiplicative inverse of n modulo p.
 * @param {Uint32Array} n
 * @returns {Uint32Array} a number m such that (n * m) % p == 1.
 */
let inverseOf = (n) => {
    let { gcd, x, y } = extended_euclidean_algorithm(n, p);
    let one = num(1);
    let check = add(mult(n, x), mult(p, y));
    if (compare(gcd, one) !== 0) {
        throw "GCD shows non-prime or zero N";
    }
    if (compare(check, one) !== 0) {
        throw "Unexpected result didn't invert";
    }
    return reduce(x);
};

/**
 * Compare numbers a and b
 * @param {Uint32Array} a
 * @param {Uint32Array} b
 * @returns {number} 0 if equal, <0 if a < b, >0 if a > b
 */
let compare = (a, b) => {
    for (let i = constants.els - 1; i >= 0; i--) {
        if (a[i] !== b[i]) {
            let c = new Int32Array([a[i], b[i]]);
            return c[0] - c[1];
        }
    }
    return 0;
};

/**
 * Return the bignum as a hex string.
 * @param {Uint32Array} a
 * @param {boolean=} keepZeros whether to keep leading zeros
 * @return {string}
 */
let toString = (a, keepZeros) => {
    let result = "";
    for (let i = 7; i >= 0; i--) {
        // noinspection JSDeprecatedSymbols
        result += ('00000000' + a[i].toString(16)).substr(-8);
    }
    if (keepZeros !== true) {
        result = result.replace(/^0*/, '');
        if (result === '') {
            result = '0';
        }
    }
    return result;
};

export {
    num,
    add,
    mult,
    sub,
    idiv,
    rotr,
    rotl,
    compare,
    inverseOf,
    toString
};

export const p = constants.p;