import * as field from '../field.js';
import * as chai from 'chai';

let expect = chai.expect;

describe('field math library', () => {

    it('should have functional toHex', () => {
        expect(field.toHex(0n, 256)).to.equal('0'.repeat(64));
        expect(field.toHex(0n)).to.equal('0');

        expect(field.toHex(1n, 256)).to.equal('0'.repeat(63) + '1');
        expect(field.toHex(1n)).to.equal('1');

        expect(field.toHex(15n)).to.equal('f');
        expect(field.toHex(15n, 0)).to.equal('f');
        for (let i = 1; i < 8; i++) {
            expect(field.toHex(15n, i)).to.equal('0f', `${i} bits`);
        }
        expect(field.toHex(15n, 9)).to.equal('000f');

        expect(field.toHex(field.p)).to.equal('7fffffff' + 'ffffffff' + 'ffffffff' +
            'ffffffff' + 'ffffffff' + 'ffffffff' + 'ffffffff' + 'ffffffed');
    });

    it('should round toHex bits properly', () => {
        expect(field.toHex(1n, 0)).to.equal('1');
        expect(field.toHex(1n, 1)).to.equal('01');
        expect(field.toHex(1n, 8)).to.equal('01');
        expect(field.toHex(1n, 9)).to.equal('0001');
    });

    it('should have working multiplicative inverse', () => {
        let chk = (n, known) => {
            let result = field.inverseOf(n);
            expect(field.reduce(n * result)).to.equal(1n, `inverseOf(${n})`);
            if (known !== undefined) {
                expect(result).to.equal(known, `inverseOf(${n})`);
            }
        };
        chk(1n, 1n);
        chk(2n, field.p / 2n + 1n);
        chk(field.p / 2n + 1n, 2n);
        chk(2n**255n-19n + 1n, 1n);
        // floor(sqrt(field.p))
        chk(0xb504f333f9de6484597d89b3754abe9fn);
        // ceil(sqrt(field.p))
        chk(0xb504f333f9de6484597d89b3754abea0n);
    });

    it('it can find exponents efficiently', () => {
        expect(field.pow(1n, 3n)).to.equal(1n);
        expect(field.pow(2n, 4n)).to.equal(16n);
        expect(field.pow(3n, 5n)).to.equal(243n);
        let p = 2n**255n-19n;
        // checking euler criteria
        expect(field.pow(7n, (p-1n)/2n)).to.equal(p-1n);
        expect(field.pow(9n, (p-1n)/2n)).to.equal(1n);
    });

    it('can find roots', () => {
        let checkSquare = (n) => {
            n = BigInt(n);
            let msg = `n=${n}`;
            let r = field.sqrt(n);
            if (n === 0n) {
                expect(r[0]).to.equal(0n, msg);
                expect(r[1]).to.equal(0n, msg);
            } else {
                expect(r[0]).to.not.equal(r[1]);
                expect(r[0] * r[0] % field.p).to.equal(n, msg);
                expect(r[1] * r[1] % field.p).to.equal(n, msg);
            }
            console.log(`${n} has roots in Fp ${r[0]} and ${r[1]}`);
        };
        let checkNotSquare = (n) => {
            n = BigInt(n);
            let msg = `n=${n}`;
            expect(() => {field.sqrt(n)}).to.throw(RangeError, 'no roots', msg);
        };

        let squares = [0, 1, 3, 4, 5, 9, (field.p/2n+4n), field.p-1n];
        let notSquares = [2, 6, 7, 8, 10, 100000, (field.p-1n)/2n-1n, (field.p-1n)/2n, (field.p/2n+1n)];

        for (let n of squares) checkSquare(n);
        for (let n of notSquares) checkNotSquare(n);
    });
});
