import json
from pathlib import Path

from src.core.settings import settings
from src.evals.runner import check_gate
from src.utils import data_acquisition as acq


def _make_cache(web: Path) -> None:
    det = web / "cache" / "wise-0855" / "d6"
    det.mkdir(parents=True)
    for n in (1, 2, 3):
        (det / f"pass-{n}.json").write_text("{}")
        (det / f"pass-{n}.png").write_bytes(b"png")


def test_build_index_scans_cache_tree(tmp_path) -> None:
    _make_cache(tmp_path)

    idx = acq.build_index(tmp_path)

    assert [t["name"] for t in idx["targets"]] == ["WISE 0855"]
    t = idx["targets"][0]
    assert t["slug"] == "wise-0855"
    assert t["ra_deg"] == settings.TARGETS[0]["ra_deg"]
    assert list(t["detectors"]) == ["d6"]
    assert [p["png"] for p in t["detectors"]["d6"]] == [
        f"cache/wise-0855/d6/pass-{n}.png" for n in (1, 2, 3)
    ]
    assert [p["json"] for p in t["detectors"]["d6"]] == [
        f"cache/wise-0855/d6/pass-{n}.json" for n in (1, 2, 3)
    ]


def test_build_index_skips_detector_without_png(tmp_path) -> None:
    det = tmp_path / "cache" / "wise-0855" / "d6"
    det.mkdir(parents=True)
    (det / "pass-1.json").write_text("{}")  # no matching png

    assert acq.build_index(tmp_path) == {"targets": []}


def test_write_index_roundtrip(tmp_path) -> None:
    _make_cache(tmp_path)

    dest = acq.write_index(tmp_path)

    assert json.loads(dest.read_text())["targets"][0]["slug"] == "wise-0855"


def test_gate_passes_on_complete_index(tmp_path) -> None:
    index = {
        "targets": [
            {
                "name": t["name"],
                "slug": "x",
                "ra_deg": 0.0,
                "dec_deg": 0.0,
                "kind": "k",
                "detectors": {"d6": [{"png": f"p{n}.png", "json": f"p{n}.json"} for n in range(3)]},
            }
            for t in settings.TARGETS
        ]
    }
    p = tmp_path / "index.json"
    p.write_text(json.dumps(index))

    assert check_gate(p) == []


def test_gate_fails_on_missing_target(tmp_path) -> None:
    index = {
        "targets": [
            {
                "name": settings.TARGETS[0]["name"],
                "detectors": {"d6": [{"png": f"p{n}.png", "json": f"p{n}.json"} for n in range(3)]},
            }
        ]
    }
    p = tmp_path / "index.json"
    p.write_text(json.dumps(index))

    problems = check_gate(p)

    assert any("missing target" in p_ for p_ in problems)


def test_gate_fails_on_thin_detector(tmp_path) -> None:
    index = {
        "targets": [
            {
                "name": t["name"],
                "detectors": {"d6": [{"png": f"p{n}.png", "json": f"p{n}.json"} for n in range(3)]},
            }
            for t in settings.TARGETS
        ]
    }
    index["targets"][0]["detectors"]["d6"] = index["targets"][0]["detectors"]["d6"][:2]
    p = tmp_path / "index.json"
    p.write_text(json.dumps(index))

    problems = check_gate(p)

    assert problems == [f"{settings.TARGETS[0]['name']} d6: 2 pass frames, need 3"]


def test_gate_fails_on_missing_file(tmp_path) -> None:
    assert check_gate(tmp_path / "nope.json")
