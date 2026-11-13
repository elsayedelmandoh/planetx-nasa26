"""propose: turn user input into values the cutout pipeline can use.
input: ra and dec strings (decimal degrees or sexagesimal).
output: (ra_deg, dec_deg) floats."""

import astropy.units as u
from astropy.coordinates import SkyCoord


def parse_coords(ra: str, dec: str) -> tuple[float, float]:
    """parse ra/dec as decimal degrees or sexagesimal ("08h 55m 10.831s", "-07d 14m 42.53s")."""
    try:
        coord = SkyCoord(float(ra), float(dec), unit=(u.deg, u.deg))
    except ValueError:
        coord = SkyCoord(ra, dec, unit=(u.hourangle, u.deg))
    return float(coord.ra.deg), float(coord.dec.deg)
