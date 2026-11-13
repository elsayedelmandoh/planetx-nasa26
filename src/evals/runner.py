"""propose: offline eval gate for make eval and ci.
input: --gate flag.
output: exit code 0 (no checks yet)."""

import argparse
import sys


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--gate", action="store_true")
    parser.parse_args()
    # ponytail: gate checks nothing (false green), upgrade when target cutouts exist
    print("no benchmark checks yet")
    return 0


if __name__ == "__main__":
    sys.exit(main())
