import pytest
from src.utils.data_processing import parse_coords

WISE_0855 = (133.795129, -7.245147)


def test_parse_coords_sexagesimal_wise_0855() -> None:
    ra, dec = parse_coords("08h 55m 10.831s", "-07d 14m 42.53s")

    assert ra == pytest.approx(WISE_0855[0], abs=1e-5)
    assert dec == pytest.approx(WISE_0855[1], abs=1e-5)


def test_parse_coords_decimal_round_trips() -> None:
    ra, dec = parse_coords("133.795129", "-7.245147")

    assert ra == pytest.approx(WISE_0855[0], abs=1e-9)
    assert dec == pytest.approx(WISE_0855[1], abs=1e-9)
