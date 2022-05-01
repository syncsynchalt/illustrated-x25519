#!/usr/bin/env python3

from textwrap import wrap

### curve25519 is y^2 = x^3 + 486662x^2 + x
base_point_x = 9
base_point_z = 1
curveA = 486662
curveB = 1
p = 2**255-19


def point_double(x: int, z: int) -> (int, int):
    """
    Given x/z ratio for point X, return x_2/z_2 ratio for point 2X.

    X_{2n} = (X_n+Z_n)^2(X_n-Z_n)^2
    Z_{2n} = (4X_nZ_n)((X_n-Z_n)^2+((A+2)/4)(4X_nZ_n))
    """
    x2_1 = (x + z) * (x + z)
    x2_2 = (x - z) * (x - z)
    x2 = x2_1 * x2_2
    z2_1 = 4 * (x * z)
    z2_2 = (x - z % p) * (x - z % p)
    z2_3 = int((curveA+2)/4) * (4 * x * z)
    z2_23 = z2_2 + z2_3
    z2 = z2_1 * z2_23
    return x2 % p, z2 % p

def point_add1(x: int, z: int, prev_x: int, prev_z: int) -> (int, int):
    """
    Given a x/z for nP and x/z for (n-1)P, calculate x/z for (n+1)P

    X_{n+1} = Z_{n-1}((X_n-Z_n)(X_1+Z_1)+(X_n+Z_n)(X_1-Z_1))^2
    Z_{n+1} = X_{n-1}((X_n-Z_n)(X_1+Z_1)-(X_n+Z_n)(X_1-Z_1))^2
    """
    xa = (x - z % p) * (base_point_x + base_point_z)
    xb = (x + z) * (base_point_x - base_point_z % p)
    xc = xa + xb
    xd = xc * xc % p
    x_nplus1 = prev_z * xd

    zc = xa - xb
    zd = zc * zc % p
    z_nplus1 = prev_x * zd

    return x_nplus1 % p, z_nplus1 % p


def point_mult(X: int, n: int) -> (int, int):
    """
    Given an x/z for point P, add it to itself n times to yield x/z for nP
    """
    # adapted from RFC7748
    x_1 = X
    x_2 = 1
    z_2 = 0
    x_3 = X
    z_3 = 1
    swap = 0
    a24 = int((curveA - 2) / 4)

    for t in reversed(range(0, 256)):
        k_t = (n >> t) & 1
        swap ^= k_t
        (x_2, x_3) = cswap(swap, x_2, x_3)
        (z_2, z_3) = cswap(swap, z_2, z_3)
        swap = k_t

        A = x_2 + z_2
        AA = A*A
        B = x_2 - z_2
        BB = B*B
        E = AA - BB
        C = x_3 + z_3
        D = x_3 - z_3
        DA = D * A
        CB = C * B
        x_3 = (DA + CB)*(DA + CB)
        z_3 = x_1 * (DA - CB)*(DA - CB)
        x_2 = AA * BB % p
        z_2 = E * (AA + a24 * E) % p
    (x_2, x_3) = cswap(swap, x_2, x_3)
    (z_2, z_3) = cswap(swap, z_2, z_3)
    return x_2, z_2


def cswap(swap: bool, x2: int, x3: int) -> (int, int):
    """
    Constant-time conditional swap.

    Adapted from RFC7748
    """
    x2 = x2 % p
    x3 = x3 % p
    if swap:
        mask = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
    else:
        mask = 0
    dummy = mask & (x2 ^ x3)
    x2 = x2 ^ dummy
    x3 = x3 ^ dummy
    return x2, x3


def extended_euclidean_algorithm(a, b):
    """
    Returns a three-tuple (gcd, x, y) such that
    a * x + b * y == gcd, where gcd is the greatest
    common divisor of a and b.

    This function implements the extended Euclidean
    algorithm and runs in O(log b) in the worst case.
    """
    s, old_s = 0, 1
    t, old_t = 1, 0
    r, old_r = b, a

    while r != 0:
        quotient = old_r // r
        old_r, r = r, old_r - quotient * r
        old_s, s = s, old_s - quotient * s
        old_t, t = t, old_t - quotient * t

    return old_r, old_s, old_t


def inverse_of(n):
    """
    Returns the multiplicative inverse of n modulo p.

    This function returns an integer m such that (n * m) % p == 1.
    """
    gcd, x, y = extended_euclidean_algorithm(n, p)
    assert (n * x + p * y) % p == gcd
    assert gcd == 1
    return x % p


def X(x, z) -> int:
    """
    Given x and z, compute X=(x/z)
    """
    return x * inverse_of(z) % p


def hex_flip_endian(hexstr: str) -> str:
    """
    given a hex string "123456" flip the endian-ness, i.e. to "563412"
    """
    return ''.join(reversed(wrap(hexstr, 2)))


def test_zero_key():
    x, z = (base_point_x, base_point_z)
    openssl_out = "2fe57da347cd62431528daac5fbb290730fff684afc4cfc2ed90995f58cb3b74"
    want = hex_flip_endian(openssl_out)
    print("finding %s" % want)
    for i in range(0, 255):
        Xval = X(x, z)
        if i == 5:
            print("...")
        if i < 5 or i > 250:
            print("{2^%03d}P X=%064x" % (i, Xval))
        (x, z) = point_double(x, z)
    assert want == "%064x" % Xval, "expected=%s got=%064x" % (want, Xval)


def calculate_np_via_add1(base_x: int, n: int) -> (int, int):
    """
    Calculate the x/z of point nP via add1 construction
    """
    prev_x, prev_z = (base_x, 1)        # 1P
    x, z = point_double(prev_x, prev_z) # 2P
    if n == 1:
        return prev_x, prev_z
    for i in range(0, n-2):
        next_x, next_z = point_add1(x, z, prev_x, prev_z)
        prev_x = x
        prev_z = z
        x = next_x
        z = next_z
    return x, z


def test_add1_vs_doubles():
    # get 16P via doubling
    x, z = (base_point_x, base_point_z)
    for i in range(0, 4):
        (x, z) = point_double(x, z)
    via_doubling = X(x, z)
    print("16P via 2x is %064x" % via_doubling)

    # get 16P via add1
    x, z = calculate_np_via_add1(base_point_x, 16)
    via_add1 = X(x, z)
    print("16P via +1 is %064x" % via_add1)
    assert via_doubling == via_add1


def test_point_mult(n: int):
    x, z = calculate_np_via_add1(base_point_x, n)
    exp_X = X(x, z)
    x, z = point_mult(base_point_x, n)
    chk_X = X(x, z)
    print("%dP exp_X is %064x" % (n, exp_X)) if exp_X != chk_X else None
    print("%dP chk_X is %064x" % (n, chk_X))
    assert exp_X == chk_X


def test_point_mult_doubles(exp: int):
    x, z = base_point_x, 1
    for i in range(0, exp):
        x, z = point_double(x, z)
    exp_X = X(x, z)
    x, z = point_mult(base_point_x, 2**exp)
    chk_X = X(x, z)
    print("{2^%d}P exp_X is %064x" % (exp, exp_X)) if exp_X != chk_X else None
    print("{2^%d}P chk_X is %064x" % (exp, chk_X))
    assert exp_X == chk_X


if __name__ == '__main__':
    test_zero_key()
    test_add1_vs_doubles()
    for i in range(1, 15):
        test_point_mult(i)
    for i in range(0, 10):
        test_point_mult_doubles(i)
    test_point_mult_doubles(254)
    test_point_mult_doubles(255)
