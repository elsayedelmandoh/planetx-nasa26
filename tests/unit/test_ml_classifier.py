"""offline tests for src/utils/ml_classifier.py on tiny synthetic arrays."""

import json

import numpy as np
import pytest
from src.utils import ml_classifier as ml


def make_diff(seed: int, shape: tuple[int, int] = (64, 64)) -> np.ndarray:
    rng = np.random.default_rng(seed)
    return rng.normal(0.0, 1.0, shape).astype(np.float32)


def test_patch_features_shape_and_nan():
    diff = make_diff(0)
    diff[10, 10] = np.nan
    diff[30:34, 30:34] = np.nan
    feats = ml.patch_features(diff, 10.0, 10.0)
    assert feats.shape == (7 * 7 + 4,)
    assert feats.dtype == np.float32
    assert np.all(np.isfinite(feats))
    # all-nan patch must not produce nan either
    feats2 = ml.patch_features(np.full((20, 20), np.nan, dtype=np.float32), 10.0, 10.0)
    assert np.all(np.isfinite(feats2))


def test_make_training_set_has_both_classes(tmp_path):
    paths = []
    for i in range(3):
        p = tmp_path / "processed" / f"slug{i}" / "d6"
        p.mkdir(parents=True)
        f = p / "diff-1-2.npy"
        np.save(f, make_diff(i + 1))
        paths.append(f)
    X, y = ml.make_training_set(paths, n_inject=5, seed=0)
    assert X.shape[0] == y.shape[0] > 0
    assert set(np.unique(y)) == {0, 1}
    assert np.all(np.isfinite(X))


def test_train_recalls_injections_and_writes_metrics(tmp_path):
    paths = []
    for i in range(4):
        p = tmp_path / "processed" / f"slug{i}" / "d6"
        p.mkdir(parents=True)
        f = p / "diff-1-2.npy"
        np.save(f, make_diff(i + 10))
        paths.append(f)
    model = tmp_path / "model" / "real_bogus.joblib"
    metrics_path = tmp_path / "cache" / "ml_metrics.json"
    metrics = ml.train(paths, out_path=model, metrics_path=metrics_path)
    assert model.exists()
    assert metrics_path.exists()
    doc = json.loads(metrics_path.read_text())
    keys = ("model", "n_train", "n_test", "recall", "false_positive_rate", "roc_auc",
            "trained_on", "note")
    for key in keys:
        assert key in doc
    assert metrics["recall"] > 0.8


def test_score_candidates_adds_ml_score(tmp_path):
    pytest.importorskip("sklearn")
    processed = tmp_path / "processed" / "slug" / "d6"
    cache = tmp_path / "cache" / "slug" / "d6"
    processed.mkdir(parents=True)
    cache.mkdir(parents=True)
    np.save(processed / "diff-1-2.npy", make_diff(42))
    # tiny model trained on synthetic backgrounds
    paths = [processed / "diff-1-2.npy"]
    model = tmp_path / "model" / "real_bogus.joblib"
    metrics_path = tmp_path / "cache" / "ml_metrics.json"
    ml.train(paths, out_path=model, metrics_path=metrics_path)
    markers = {
        "detections": [
            {"x": 10.0, "y": 10.0, "label": "unmatched moving candidate",
             "peak_sigma": 6.0, "sign": "dipole"},
            {"x": 40.0, "y": 40.0, "label": "unmatched residual",
             "peak_sigma": 5.5, "sign": 1},
        ],
        "sigma": 1.0,
        "method": "rule-based",
    }
    mpath = cache / "diff-1-2.markers.json"
    mpath.write_text(json.dumps(markers))
    n = ml.score_candidates(
        processed_dir=tmp_path / "processed",
        cache_dir=tmp_path / "cache",
        model_path=model,
    )
    assert n == 1
    doc = json.loads(mpath.read_text())
    for d in doc["detections"]:
        assert 0.0 <= d["ml_score"] <= 1.0
