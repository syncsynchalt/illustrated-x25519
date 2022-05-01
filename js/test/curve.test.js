import * as curve from '../curve.js';
import * as field from '../field.js';
import * as chai from 'chai';

let expect = chai.expect;

describe('curve library', () => {

    it ('should match openssl "zero key" result', () => {
        let x = curve.basePointX;
        let z = 1n;
        const openssl_out = '2fe57da347cd62431528daac5fbb290730fff684afc4cfc2ed90995f58cb3b74';
        const want = field.hexFlipEndian(openssl_out);

        let i = 0;
        let printX = () => {
            let X = curve.X(x, z);
            if (i === 5) console.log('...');
            if (i < 5 || i > 250) {
                let iPad = (`000${i}`.slice(-3));
                console.log(`{2^${iPad}}P X=${field.toHex(X, 256)}`);
            }
        }

        for (i = 0; i < 254; i++) {
            printX();
            ({ x, z } = {...curve.pointDouble(x, z)});
        }
        printX();

        let X = curve.X(x, z);
        expect(field.toHex(X)).to.equal(want);
    });

    /**
     * Calculate the x/z of point nP via add1 construction
     * @param baseX {BigInt}
     * @param n {Number}
     * @return {{x: BigInt, z: BigInt}}
     */
    let calcViaAdd1 = (baseX, n) => {
        let [ prev_x, prev_z ] = [ curve.basePointX, 1n ]; // 1P
        let { x, z } = curve.pointDouble(prev_x, prev_z);  // 2P
        if (n === 1) return { x: prev_x, z: prev_z };

        let next_x = 0n, next_z = 0n;
        for (let i = 0; i < n-2; i++) {
            ({x: next_x, z: next_z} = curve.pointAdd1(x, z, prev_x, prev_z));
            [prev_x, prev_z] = [x, z];
            [x, z] = [next_x, next_z];
        }
        return { x, z };
    };

    it('can match add1 to result via doubling', () => {
        for (let exp = 0; exp < 10; exp++) {
            let n = 2**exp;
            let nPad = `000${n}`.slice(-3);

            // get {2^exp}P via doubling
            let [x, z] = [curve.basePointX, 1n];
            for (let i = 0; i < exp; i++) {
                ({x, z} = curve.pointDouble(x, z));
            }
            let viaDoubling = curve.X(x, z);
            console.log(`${nPad}P via 2x is ${field.toHex(viaDoubling, 256)}`);

            // get {2^exp}P via add1
            ({x, z} = calcViaAdd1(curve.basePointX, n));
            let viaAdd1 = curve.X(x, z)
            console.log(`${nPad}P via +1 is ${field.toHex(viaAdd1, 256)}`)

            // compare them
            expect(field.toHex(viaDoubling, 256))
                .to.equal(field.toHex(viaAdd1, 256), `${nPad}P`);
            expect(viaDoubling).to.equal(viaAdd1, `${nPad}P`);
        }
    });

    it('should have working scalar multiplication (compare to add1)', () => {
        let runTest = (n, msg) => {
            let {x, z} = calcViaAdd1(curve.basePointX, n);
            let expX = curve.X(x, z);
            // console.log(`expX for ${n} is ${field.toHex(expX)}`);
            ({x, z} = curve.pointMult(curve.basePointX, BigInt(n)));
            let chkX = curve.X(x, z);

            expect(chkX).to.equal(expX, msg);
        };
        runTest(3, `${3}P`);
        for (let n = 1; n < 100; n++) {
            runTest(n, `${n}P`);
        }
    });

    it('should have working scalar multiplication (compare to doubling)', () => {
        let runTest = (exp, msg) => {
            let [x, z] = [curve.basePointX, 1n];
            for (let i = 0; i < exp; i++) {
                ({x, z} = curve.pointDouble(x, z));
            }
            let expX = curve.X(x, z);
            ({x, z} = curve.pointMult(curve.basePointX, 2n ** BigInt(exp)));
            let chkX = curve.X(x, z)
            expect(chkX).to.equal(expX, msg);
        }
        for (let exp = 0; exp < 100; exp++) {
            runTest(exp, `${2**exp}P`);
        }
    });
});
