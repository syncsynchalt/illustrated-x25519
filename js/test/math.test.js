import * as math from '../math.js';
import * as chai from 'chai';

let assert = chai.assert;
let expect = chai.expect;

describe('math library', () => {

    it('should do basic addition', () => {
        let one = math.num(1);
        let two = math.num(2);
        let chk = math.add(one, one);
        assert.equal(math.compare(chk, two), 0);
    });

    it('should have functional toString', () => {
        let zero = math.num();
        let one = math.num(1);
        let p = math.p;

        expect(math.toString(zero, true)).to.equal('0'.repeat(64));
        expect(math.toString(zero)).to.equal('0');
        expect(math.toString(one, true)).to.equal('0'.repeat(63) + '1');
        expect(math.toString(one)).to.equal('1');
        expect(math.toString(p)).to.equal('7fffffff' + 'ffffffff' + 'ffffffff' +
            'ffffffff' + 'ffffffff' + 'ffffffff' + 'ffffffff' + 'ffffffed');
    });

    // xxx add some tests for add/sub carries

    it('compares correctly', () => {
        let zero = math.num(0);
        let one = math.num(1);
        let two = math.num(2);
        expect(math.compare(zero, one)).to.be.lessThan(0);
        expect(math.compare(zero, zero)).to.equal(0);
        expect(math.compare(one, zero)).to.be.greaterThan(0);

        expect(math.compare(one, two)).to.be.lessThan(0);
        expect(math.compare(one, one)).to.equal(0);
        expect(math.compare(two, one)).to.be.greaterThan(0);
    });

    it('rotates numbers', () => {
        let fifteen = math.num(15);
        expect(math.toString(fifteen)).to.equal('f')
        math.rotl(fifteen, 1);
        math.rotl(fifteen, 1);
        expect(math.toString(fifteen)).to.equal('3c')
        math.rotr(fifteen, 1);
        math.rotr(fifteen, 1);
        expect(math.toString(fifteen)).to.equal('f')

        math.rotl(fifteen, 2);
        expect(math.toString(fifteen)).to.equal('3c')
        math.rotr(fifteen, 2);
        expect(math.toString(fifteen)).to.equal('f')

        math.rotl(fifteen, 32);
        expect(math.toString(fifteen)).to.equal('f00000000')
        math.rotr(fifteen, 32);
        expect(math.toString(fifteen)).to.equal('f')
    });

    it('should multiply', () => {
        let six = math.num(6);
        let seven = math.num(7);
        let fortyTwo = math.mult(six, seven);
        expect(math.toString(fortyTwo)).to.equal('2a');

        let x = math.num(37283);
        x = math.mult(x, math.num(234235));
        expect(math.toString(x)).to.equal('20886c0d1');
        x = math.mult(x, math.num(2352342));
        x = math.mult(x, math.num(7988878));
        x = math.mult(x, math.num(9293234));
        expect(math.toString(x)).to.equal('fd270d1e82c1acb4f95a8');
    });
});