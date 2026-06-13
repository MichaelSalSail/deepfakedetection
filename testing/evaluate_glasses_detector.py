"""
Tentative eyewear evaluation script (not run yet).

Runs glasses-detector==0.1.1 (AnyglassesClassifier, small) on PNGs in testing/images/
for filenames listed in sunglasses_shades.csv and sunglasses_glasses.csv. Exports
side-by-side CSVs with VGG16 (legacy Predict % from input) and glasses-detector
(probability * 100). Requires Python 3.10+. See tentative_eyewear_model_testing.ipynb
for background on VGG16 limits and accuracy comparison.

Usage (from testing/): python evaluate_glasses_detector.py
"""

from __future__ import annotations

import os
import sys

import pandas as pd

try:
    from glasses_detector import AnyglassesClassifier
except ImportError as exc:
    raise SystemExit(
        "glasses-detector is not installed. Use Python 3.10+ and run:\n"
        "  pip install glasses-detector==0.1.1 pandas\n"
        f"Original error: {exc}"
    ) from exc


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(SCRIPT_DIR, "images")
STORED_RESULTS_DIR = os.path.join(SCRIPT_DIR, "Stored Test Results")

INPUT_OUTPUT_PAIRS = (
    (
        os.path.join(STORED_RESULTS_DIR, "sunglasses_glasses.csv"),
        os.path.join(STORED_RESULTS_DIR, "sunglasses_glasses_glasses_detector.csv"),
    ),
    (
        os.path.join(STORED_RESULTS_DIR, "sunglasses_shades.csv"),
        os.path.join(STORED_RESULTS_DIR, "sunglasses_shades_glasses_detector.csv"),
    ),
)


def load_classifier() -> AnyglassesClassifier:
    classifier = AnyglassesClassifier(base_model="small", pretrained=True)
    classifier.eval()
    return classifier


def predict_percent(classifier: AnyglassesClassifier, image_path: str) -> float:
    probability = classifier.predict(image_path, label_type="proba")
    return round(float(probability) * 100, 2)


def file_size_kb(image_path: str) -> float:
    return round(os.path.getsize(image_path) / 1024, 2)


def evaluate_csv(classifier: AnyglassesClassifier, input_csv: str, output_csv: str) -> pd.DataFrame:
    source = pd.read_csv(input_csv)
    if "Name" not in source.columns:
        raise ValueError(f"{input_csv} must contain a Name column")
    if "Predict (%)" not in source.columns:
        raise ValueError(f"{input_csv} must contain a Predict (%) column (VGG16 baseline)")

    rows = []
    missing = []

    for _, row in source.iterrows():
        filename = row["Name"]
        vgg16_predict = round(float(row["Predict (%)"]), 2)
        image_path = os.path.join(IMAGES_DIR, filename)

        if not os.path.isfile(image_path):
            missing.append(filename)
            rows.append(
                {
                    "Name": filename,
                    "Size (KB)": row["Size (KB)"] if "Size (KB)" in source.columns else None,
                    "VGG16": vgg16_predict,
                    "glasses-detector": 0.0,
                }
            )
            continue

        rows.append(
            {
                "Name": filename,
                "Size (KB)": file_size_kb(image_path),
                "VGG16": vgg16_predict,
                "glasses-detector": predict_percent(classifier, image_path),
            }
        )

    result = pd.DataFrame(rows, columns=["Name", "Size (KB)", "VGG16", "glasses-detector"])
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    result.to_csv(output_csv, index=False)

    total = len(result)
    vgg16_detected = int((result["VGG16"] > 0).sum())
    gd_detected = int((result["glasses-detector"] > 0).sum())
    print(f"Wrote {output_csv}")
    print(
        f"  images: {total}, VGG16 detected: {vgg16_detected} ({vgg16_detected / total * 100:.1f}%), "
        f"glasses-detector detected: {gd_detected} ({gd_detected / total * 100:.1f}%)"
    )
    if missing:
        print(f"  missing from {IMAGES_DIR}: {len(missing)} (glasses-detector set to 0.0)")
        for name in missing[:5]:
            print(f"    - {name}")
        if len(missing) > 5:
            print("    ...")

    return result


def main() -> int:
    if not os.path.isdir(IMAGES_DIR):
        print(f"Expected image directory not found: {IMAGES_DIR}", file=sys.stderr)
        return 1

    print("Loading AnyglassesClassifier (small, pretrained)...")
    classifier = load_classifier()

    for input_csv, output_csv in INPUT_OUTPUT_PAIRS:
        if not os.path.isfile(input_csv):
            print(f"Skipping missing input CSV: {input_csv}", file=sys.stderr)
            continue
        print(f"\nEvaluating {os.path.basename(input_csv)} ...")
        evaluate_csv(classifier, input_csv, output_csv)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
