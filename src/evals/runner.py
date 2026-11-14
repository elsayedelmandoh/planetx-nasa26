"""propose: offline eval gate for make eval and ci.
input: --gate [index.json path].
output: exit 0 when all benchmark targets are in the index with >=3 passes each, else 1."""

import argparse
import json
import sys
from pathlib import Path

from src.core.settings import settings

MIN_PASSES = 3


def check_gate(index_path: Path) -> list[str]:
    """return a list of problems; empty means the gate passes."""
    if not index_path.exists():
        return [f"index not found: {index_path} (run python -m src.utils.data_acquisition)"]
    try:
        data = json.loads(index_path.read_text())
    except json.JSONDecodeError as err:
        return [f"index is not valid json: {index_path}: {err}"]
    by_name = {t.get("name"): t for t in data.get("targets", [])}
    problems = []
    for t in settings.TARGETS:
        entry = by_name.get(t["name"])
        if entry is None:
            problems.append(f"missing target: {t['name']}")
            continue
        detectors = entry.get("detectors") or {}
        if not detectors:
            problems.append(f"{t['name']}: no detectors with pass frames")
            continue
        for det, passes in detectors.items():
            if len(passes) < MIN_PASSES:
                problems.append(f"{t['name']} {det}: {len(passes)} pass frames, need {MIN_PASSES}")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--gate", action="store_true")
    parser.add_argument("path", nargs="?", default=None,
                        help="index.json path (default web/cache/index.json)")
    args = parser.parse_args()
    if not args.gate:
        print("no benchmark checks yet")
        return 0
    index_path = Path(args.path) if args.path else settings.WEB_DIR / "cache" / "index.json"
    problems = check_gate(index_path)
    if problems:
        print(f"eval gate failed ({index_path}):")
        for p in problems:
            print(f"  - {p}")
        return 1
    print(f"eval gate passed ({index_path})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
