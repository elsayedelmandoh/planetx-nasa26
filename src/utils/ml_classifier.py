"""propose: real-bogus classifier for rule-based difference-image candidates.

input: raw difference arrays from data/processed/<slug>/<det>/diff-<a>-<b>.npy
(render_passes saves them before display stretch).
output: trained model in data/processed/model/real_bogus.joblib,
metrics in web/cache/ml_metrics.json, "ml_score" added to each detection in
web/cache/<slug>/<det>/diff-*.markers.json.

training data is synthetic movers injected into real spherex difference images; the classifier
ranks candidates, it does not make discoveries.
"""

import argparse
import json
from pathlib import Path

import joblib
import numpy as np

from src.core.settings import settings

MODEL_REL = Path("processed") / "model" / "real_bogus.joblib"
METRICS_REL = Path("cache") / "ml_metrics.json"
HALF = 3  # 7x7 patch
NPAD = HALF + 5  # margin so the injected dipole and its psf tails stay on frame


def robust_sigma(diff: np.ndarray) -> float:
    """1.4826 * mad of the finite pixels, 0.0 when empty or degenerate."""
    finite = diff[np.isfinite(diff)]
    if finite.size == 0:
        return 0.0
    return float(1.4826 * np.median(np.abs(finite - np.median(finite))))


def patch_features(diff: np.ndarray, x: float, y: float, half: int = HALF) -> np.ndarray:
    """flattened sigma-normalised patch plus 4 scalar features. nan -> 0.

    scalars: peak positive sigma, peak negative sigma (magnitude), distance between the
    positive and negative peaks in px, and |sum| / sum|.| symmetry (1 = one sign only).
    """
    sigma = robust_sigma(diff)
    xi, yi = int(round(x)), int(round(y))
    size = 2 * half + 1
    patch = np.zeros((size, size), dtype=np.float64)
    # copy whatever fits; out-of-frame stays 0
    src_y0, src_y1 = max(0, yi - half), min(diff.shape[0], yi + half + 1)
    src_x0, src_x1 = max(0, xi - half), min(diff.shape[1], xi + half + 1)
    dst_y0, dst_x0 = src_y0 - (yi - half), src_x0 - (xi - half)
    patch[dst_y0:dst_y0 + (src_y1 - src_y0), dst_x0:dst_x0 + (src_x1 - src_x0)] = \
        diff[src_y0:src_y1, src_x0:src_x1]
    p = patch / sigma if sigma > 0 else patch
    p = np.nan_to_num(p, nan=0.0)
    flat = p.ravel()
    i_max, i_min = int(np.argmax(p)), int(np.argmin(p))
    ay, ax = divmod(i_max, size)
    by, bx = divmod(i_min, size)
    dist = float(np.hypot(ax - bx, ay - by))
    denom = float(np.abs(p).sum())
    symmetry = abs(float(p.sum())) / denom if denom > 0 else 0.0
    feats = np.concatenate([flat, [p.max(), -p.min(), dist, symmetry]])
    return np.nan_to_num(feats, nan=0.0).astype(np.float32)


def _finite_locs(diff: np.ndarray, half: int) -> np.ndarray:
    """indices of pixels whose (2*half+1)^2 neighborhood is fully finite and on-frame."""
    from scipy import ndimage

    ok = np.isfinite(diff).astype(np.float64)
    size = 2 * half + 1
    # sum of the neighborhood via box filter; a loc is usable only if the whole patch is finite
    counts = ndimage.uniform_filter(ok, size=size, mode="constant", cval=0.0) * size * size
    ys, xs = np.nonzero(counts > size * size - 0.5)
    return np.stack([xs, ys], axis=1) if len(xs) else np.empty((0, 2), int)


def _add_gaussian(
    stamp: np.ndarray, cy: float, cx: float, amp: float, psf_sigma: float = 1.0
) -> None:
    r = 4
    y0, y1 = max(0, int(cy) - r), min(stamp.shape[0], int(cy) + r + 1)
    x0, x1 = max(0, int(cx) - r), min(stamp.shape[1], int(cx) + r + 1)
    yy, xx = np.mgrid[y0:y1, x0:x1]
    stamp[y0:y1, x0:x1] += amp * np.exp(-((yy - cy) ** 2 + (xx - cx) ** 2) / (2 * psf_sigma**2))


def _inject(diff: np.ndarray, rng: np.random.Generator) -> tuple[np.ndarray, float, float] | None:
    """add a +/- gaussian dipole (peak 4-15 robust sigma, sep 0.5-3 px) at a random finite spot."""
    sigma = robust_sigma(diff)
    if sigma <= 0:
        return None
    locs = _finite_locs(diff, HALF)
    if len(locs) == 0:
        return None
    x, y = locs[rng.integers(len(locs))]
    amp = rng.uniform(4, 15) * sigma
    sep = rng.uniform(0.5, 3.0)
    angle = rng.uniform(0, 2 * np.pi)
    dx, dy = sep / 2 * np.cos(angle), sep / 2 * np.sin(angle)
    out = diff.copy()
    _add_gaussian(out, y + dy, x + dx, +amp)
    _add_gaussian(out, y - dy, x - dx, -amp)
    return out, float(x), float(y)


def _markers_for(diff_path: Path) -> Path | None:
    """map data/processed/<slug>/<det>/diff-a-b.npy to the matching markers json in web/cache."""
    slug, det = diff_path.parent.parent.name, diff_path.parent.name
    markers = settings.WEB_DIR / "cache" / slug / det / (diff_path.stem + ".markers.json")
    return markers if markers.exists() else None


def make_training_set(diff_paths, n_inject: int = 20, seed: int = 0):
    """build (X, y): injected movers as 1, real background away from candidates as 0."""
    rng = np.random.default_rng(seed)
    X, y = [], []
    for path in diff_paths:
        diff = np.load(path)
        if robust_sigma(diff) <= 0:
            continue
        locs = _finite_locs(diff, HALF)
        if len(locs) == 0:
            continue
        for _ in range(n_inject):
            inj = _inject(diff, rng)
            if inj is None:
                continue
            frame, x, y0 = inj
            X.append(patch_features(frame, x, y0))
            y.append(1)
        # detector candidates are unlabelled (some may be real movers), so negatives avoid them
        markers = _markers_for(Path(path))
        cands = json.loads(markers.read_text()).get("detections", []) if markers else []
        far = [
            (x, y0) for x, y0 in locs
            if all((x - c["x"]) ** 2 + (y0 - c["y"]) ** 2 > 9 for c in cands)
        ]
        for _ in range(n_inject if far else 0):
            x, y0 = far[rng.integers(len(far))]
            X.append(patch_features(diff, float(x), float(y0)))
            y.append(0)
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int64)


def train(diff_paths, out_path: Path | None = None, metrics_path: Path | None = None) -> dict:
    """train gradient boosting on injected-vs-background, save model + metrics json."""
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.metrics import confusion_matrix, roc_auc_score
    from sklearn.model_selection import train_test_split

    out_path = Path(out_path) if out_path else settings.DATA_DIR / MODEL_REL
    metrics_path = Path(metrics_path) if metrics_path else settings.WEB_DIR / METRICS_REL
    X, y = make_training_set(diff_paths)
    if len(np.unique(y)) < 2:
        raise SystemExit(
            "training set has one class only; need injected movers and background"
        )
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, random_state=0, stratify=y
    )
    clf = GradientBoostingClassifier(random_state=0)
    clf.fit(X_tr, y_tr)
    proba = clf.predict_proba(X_te)[:, 1]
    pred = (proba >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_te, pred, labels=[0, 1]).ravel()
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    fpr = fp / (fp + tn) if (fp + tn) else 0.0
    metrics = {
        "model": "GradientBoostingClassifier",
        "n_train": int(len(X_tr)),
        "n_test": int(len(X_te)),
        "recall": round(float(recall), 4),
        "false_positive_rate": round(float(fpr), 4),
        "roc_auc": round(float(roc_auc_score(y_te, proba)), 4),
        "trained_on": "synthetic movers injected into real spherex dr1 difference images",
        "note": "scores rank candidates; they are not discoveries",
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, out_path)
    metrics_path.parent.mkdir(parents=True, exist_ok=True)
    metrics_path.write_text(json.dumps(metrics, indent=2) + "\n")
    return metrics


def score_candidates(
    processed_dir: Path | None = None,
    cache_dir: Path | None = None,
    model_path: Path | None = None,
) -> int:
    """add ml_score to every detection in cached markers json that has a matching .npy."""
    processed_dir = Path(processed_dir) if processed_dir else settings.DATA_DIR / "processed"
    cache_dir = Path(cache_dir) if cache_dir else settings.WEB_DIR / "cache"
    model_path = Path(model_path) if model_path else settings.DATA_DIR / MODEL_REL
    if not model_path.exists():
        raise SystemExit(
            f"no model at {model_path}; run `python -m src.utils.ml_classifier train` first"
        )
    clf = joblib.load(model_path)
    scored = 0
    for markers in sorted(cache_dir.glob("*/*/diff-*.markers.json")):
        slug, det = markers.parent.parent.name, markers.parent.name
        npy = processed_dir / slug / det / (markers.stem.replace(".markers", "") + ".npy")
        if not npy.exists():
            continue
        diff = np.load(npy)
        doc = json.loads(markers.read_text())
        for d in doc.get("detections", []):
            feats = patch_features(diff, float(d["x"]), float(d["y"]))
            d["ml_score"] = round(float(clf.predict_proba(feats.reshape(1, -1))[0, 1]), 2)
        markers.write_text(json.dumps(doc, indent=2) + "\n")
        scored += 1
    return scored


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["train", "score"])
    args = ap.parse_args()
    if args.command == "train":
        diff_paths = sorted((settings.DATA_DIR / "processed").glob("*/*/diff-*.npy"))
        if not diff_paths:
            raise SystemExit("no diff-*.npy under data/processed; render_passes must run first")
        metrics = train(diff_paths)
        print(json.dumps(metrics, indent=2))
    else:
        print(f"scored {score_candidates()} markers files")


if __name__ == "__main__":
    main()
