"""
Runs glasses-detector's SunglassesClassifier on every "mix*" image in
testing/images/ and exports scores alongside the ground-truth label encoded
in the filename (name ends with "_glasses" -> True), for threshold tuning.
Requires Python 3.10+ with glasses-detector installed (see
evaluate_glasses_detector.py for why SunglassesClassifier, not
AnyglassesClassifier, is used).

Usage (from testing/): python evaluate_glasses_detector2.py
"""

from __future__ import annotations

import os

import pandas as pd

from evaluate_glasses_detector import IMAGES_DIR, STORED_RESULTS_DIR, load_classifier, predict_percent

OUTPUT_CSV = os.path.join(STORED_RESULTS_DIR, "glasses_detector_mix.csv")


def true_label(filename: str) -> bool:
    return os.path.splitext(filename)[0].endswith("_glasses")


def main() -> int:
    mix_files = sorted(
        f for f in os.listdir(IMAGES_DIR)
        if "mix" in f.lower() and f.lower().endswith(".png")
    )
    if not mix_files:
        print(f"No 'mix' images found in {IMAGES_DIR}")
        return 1

    print("Loading SunglassesClassifier (small, pretrained)...")
    classifier = load_classifier()

    rows = [
        {
            "Name": filename,
            "glasses": true_label(filename),
            "glasses-detector": predict_percent(classifier, os.path.join(IMAGES_DIR, filename)),
        }
        for filename in mix_files
    ]

    result = pd.DataFrame(rows, columns=["Name", "glasses", "glasses-detector"])
    result.to_csv(OUTPUT_CSV, index=False)

    positives = int(result["glasses"].sum())
    print(f"Wrote {OUTPUT_CSV} ({len(result)} images, {positives} true positives, {len(result) - positives} true negatives)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
