#!/usr/bin/env python3

import sys

gran = 1024*1024
p = 2**255-19

def die_usage():
    sys.stderr.write('Usage: %s [dots]' % sys.argv[0])
    sys.exit(1)


dots = 100
preamble = '''
iwidth=640*2
iheight=480*2
set terminal pngcairo size iwidth,iheight
set border 0
unset key
unset title

xbound = {dots}
ybound = {gran}
lwidth = 3

set arrow to xbound,0 size screen 0.010,20,80 filled front linestyle 1 linetype rgb "#333333" linewidth lwidth
set arrow to 0,ybound size screen 0.010,20,80 filled front linestyle 1 linetype rgb "#333333" linewidth lwidth

set ytics ("0" 0, "p" {gran}) scale 0
set xtics ("0" 0, "{dots:,}" 0.98*{dots}) scale 0
set tics font ", 25"
set lmargin 6
set rmargin 5
set bmargin 3
set tmargin 2

plot '-' with points pt 7 lc rgb "#006400"
'''


def shanksPartitions(prime):
    '''
    "By factoring out powers of 2, find Q and S such that p−1 = Q*2^S with Q odd"
    '''
    Q = prime - 1
    S = 0

    while Q != 0 and Q % 2 == 0:
        Q >>= 1
        S += 1
    assert Q != 0, 'Unexpected failure to factor out Shanks partitions'
    return (Q, S)


def eulers_criterion(n):
    '''
    Use Euler's Criterion to test whether n has valid roots in Fp.
    '''
    pHalf = (p-1)//2
    return pow(n, pHalf, p) == 1


def roots_for(r):
    '''
    Given one root in Fp, derive and return the pair.
    '''
    return (r, p-r)


def mod_sqrt(n):
    '''
    modular square root
    '''
    if n == 0:
        return 0, None
    if not eulers_criterion(n):
        return None, None

    # Tonelli–Shanks algorithm
    Q, S = shanksPartitions(p)

    # find a z which is not a square
    for z in range(2, p):
        if not eulers_criterion(z):
            break

    M = S
    c = pow(z, Q, p)
    t = pow(n, Q, p)
    R = pow(n, (Q+1)//2, p)
    while True:
        if t == 0:
            return 0, None
        if t == 1:
            return roots_for(R)

        # use repeated squaring to find the least i, 0 < i < M, such that t^{2^i} = 1 mod p
        for i in range(1, M):
            chk = pow(t, (2**i), p)
            if chk == 1:
                break
        b = c**(2**(M-i-1))
        M = i
        bb = b * b
        c = bb % p
        t = t * bb % p
        R = R * b % p


def yvals(x):
    '''
    Curve25519 in modular math
    (curve is y^2 = x^3 + 486662x^2 + x)
    '''
    rval = pow(x, 3, p) + 486662 * pow(x, 2, p) + x
    return mod_sqrt(rval % p)


def chk(x, y):
    '''
    Confirm this x,y point is on the curve
    '''
    assert y*y % p == (pow(x, 3, p) + 486662 * pow(x, 2, p) + x) % p


if __name__ == '__main__':
    if len(sys.argv) != 1:
        if sys.argv[1].isnumeric():
            dots = int(sys.argv[1])
        else:
            die_usage()

    print(preamble.format(dots=dots, gran=gran))

    for x in range(0, dots+1):
        y1, y2 = yvals(x)
        if y1 is not None:
            chk(x, y1)
            print("%d %d" % (x, y1*gran // p))
        if y2 is not None:
            chk(x, y2)
            print("%d %d" % (x, y2*gran // p))
