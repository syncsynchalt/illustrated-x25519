set view 0,0
isosamples = 500
samples = 500
set samples samples,samples
set isosamples isosamples,isosamples
set contour base
set cntrparam levels discrete 0

iwidth=640*3
iheight=480*3
set terminal pngcairo size iwidth,iheight crop
set border 0
unset xtics
unset ytics
unset surface
unset grid
unset key
unset ztics

xleft = 5.5*10**5
xright = 5.5*10**5
ybound = 4*10**8
lwidth = 3

set xrange [-xleft:xright]
set yrange [-ybound:ybound]

set arrow to 0,-ybound size screen 0.010,20,80 filled front linestyle 1 linetype rgb "#333333" linewidth lwidth
set arrow to 0,ybound size screen 0.010,20,80 filled front linestyle 1 linetype rgb "#333333" linewidth lwidth
set arrow to -xleft,0 size screen 0.010,20,80 filled front linestyle 1 linetype rgb "#333333" linewidth lwidth
set arrow to xright,0 size screen 0.010,20,80 filled front linestyle 1 linetype rgb "#333333" linewidth lwidth

set linetype 2 lc rgb "#006400"

f(x,y) = x**3 + 486662*(x**2) + x - y**2
splot f(x,y) linestyle 1 linewidth lwidth
