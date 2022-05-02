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
});
