# PPLN SPDC Bench

Interactive browser simulator for spontaneous parametric down-conversion (SPDC) in MgO:PPLN, covering first- and higher-order quasi-phase-matching in a collinear plane-wave model.

Open `index.html` in a browser. It is a single self-contained page with no build step.

## Features

- Type-0, Type-I and Type-II interactions, with QPM orders m = 1, 3, 5
- Presets: 775 → 1550 nm, 405 → 810 nm, 532 → 810 + 1550 nm, and 775 → 1550 nm Type-II pulsed
- Fits the poling period to a target, or finds the phase-matching temperature
- Readouts: period at T, signal/idler wavelengths, CW bandwidth, temperature acceptance, d_eff, spectral purity (Schmidt K)
- Plots: phase-matching spectrum, temperature tuning curve, joint spectral intensity, temperature acceptance

## Model

- Temperature-dependent Sellmeier equation for 5 mol% MgO:CLN (Gayer et al., Appl. Phys. B 91, 343 (2008)), in the form given in the [HC Photonics PPLN guide](https://www.hcphotonics.com/ppln-guide-overview)
- Thermal expansion of the grating: Λ(T) = Λ₀[1 + α(T−25) + β(T−25)²]
- Phase-matching function sinc(Δk L / 2) with a Gaussian pump envelope; purity computed from a 96×96 sampled JSA

Not modelled: focusing (Boyd–Kleinman / Bennink), absolute pair rates, waveguide dispersion, poling duty-cycle errors, non-collinear emission.
