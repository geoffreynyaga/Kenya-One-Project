#weissinger
The Weissinger-L method is an extension of Prandtl's lifting line theory to swept and tapered wings. It is also valid to lower aspect ratios than lifting line theory. The usual linear aerodynamics assumptions apply. This code is an implementation of the Weissinger-L method in Python. For a given wing geometry, it reports the lift and induced drag coefficients and creates plots of the lift distribution and wing shape.

You need:
* Python (tested with version 2.7.11 and 3.5.2)
* numpy (tested with version 1.11)
* matplotlib (tested with version 1.5.3)

If you use Linux, these are all likely available through your distribution's repositories. Alternatively, or if you use Windows, you can use a prepackaged Python suite such as Enthought Canopy, or Anaconda.

To run, edit inputs.py as desired and double-click run_weissinger.py. (You may need to select Python as the application to run the filetype first). You can also run in a terminal window/command prompt as follows:
./run_weissinger.py (Linux, Mac OSX)
                 or
python.exe run_weissinger.py (Windows)

(In either case, it is assumed that Python has been installed in your executable path.)
