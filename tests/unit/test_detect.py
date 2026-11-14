import numpy as np
from src.utils.data_processing import detect


def noise(seed: int = 0, shape: tuple[int, int] = (64, 64)) -> np.ndarray:
    return np.random.default_rng(seed).normal(0.0, 1.0, shape).astype(np.float32)


def put_dipole(arr: np.ndarray, x: int, y: int, amp: float = 12.0) -> None:
    arr[y, x - 1] = -amp  # negative lobe at the pass-a position
    arr[y, x + 1] = amp   # positive lobe at the pass-b position


def test_dipole_at_expected_position_is_known_mover() -> None:
    arr = noise()
    put_dipole(arr, 32, 32)
    out = detect(arr, sigma_k=5, expected_px=[(32.0, 32.0)])
    labels = [d["label"] for d in out["detections"]]
    assert "known high-proper-motion object" in labels


def test_dipole_elsewhere_is_unmatched_candidate() -> None:
    arr = noise()
    put_dipole(arr, 50, 10)
    out = detect(arr, sigma_k=5, expected_px=[(32.0, 32.0)])
    labels = [d["label"] for d in out["detections"]]
    assert "unmatched moving candidate" in labels
    assert "known high-proper-motion object" not in labels


def test_pure_noise_gives_no_detections() -> None:
    out = detect(noise(seed=42), sigma_k=5, expected_px=[(32.0, 32.0)])
    assert out["detections"] == []
    assert out["sigma"] > 0


def test_single_residual_at_target_is_variable_source() -> None:
    arr = noise()
    arr[20, 34] = 12.0
    out = detect(arr, sigma_k=5, expected_px=[(34.0, 20.0)])
    labels = [d["label"] for d in out["detections"]]
    assert "variable source" in labels


def test_dipole_on_static_gaia_star_is_static_residual() -> None:
    arr = noise()
    put_dipole(arr, 32, 32)
    out = detect(arr, sigma_k=5, expected_px=[], gaia_px=[{"x": 32.0, "y": 32.0, "shift": 0.1}])
    labels = [d["label"] for d in out["detections"]]
    assert "static star residual" in labels
    assert "unmatched moving candidate" not in labels
    assert out["n_gaia_stars"] == 1


def test_dipole_on_fast_gaia_star_is_known_mover() -> None:
    arr = noise()
    put_dipole(arr, 32, 32)
    out = detect(arr, sigma_k=5, expected_px=[], gaia_px=[{"x": 32.0, "y": 32.0, "shift": 2.0}])
    dets = out["detections"]
    known = [d for d in dets if d["label"] == "known high-proper-motion object"]
    assert known and known[0]["gaia"] is True


def test_isolated_dipole_is_unmatched_candidate() -> None:
    arr = noise()
    put_dipole(arr, 50, 10)
    out = detect(arr, sigma_k=5, expected_px=[], gaia_px=[{"x": 10.0, "y": 10.0, "shift": 0.1}])
    labels = [d["label"] for d in out["detections"]]
    assert "unmatched moving candidate" in labels


def test_single_sign_residual_near_gaia_star_is_static_residual() -> None:
    arr = noise()
    arr[20, 34] = 12.0
    out = detect(arr, sigma_k=5, expected_px=[], gaia_px=[{"x": 34.0, "y": 20.0, "shift": 0.1}])
    labels = [d["label"] for d in out["detections"]]
    assert "static star residual" in labels


def test_target_rule_beats_gaia_rule() -> None:
    arr = noise()
    put_dipole(arr, 32, 32)
    out = detect(arr, sigma_k=5, expected_px=[(32.0, 32.0)],
                 gaia_px=[{"x": 32.0, "y": 32.0, "shift": 0.1}])
    labels = [d["label"] for d in out["detections"]]
    assert "known high-proper-motion object" in labels
    assert "static star residual" not in labels
