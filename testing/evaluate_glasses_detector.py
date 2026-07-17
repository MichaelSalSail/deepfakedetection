"""
Runs both VGG16 (ImageNet top-5, same "sunglasses"/"sunglass" label rule as
backend/all_models.py's detect_shades) and glasses-detector==0.1.1
(SunglassesClassifier, small) on PNGs in testing/images/ for filenames listed
in sunglasses_shades.csv and sunglasses_glasses.csv. Exports side-by-side CSVs
with both scores (VGG16 label percentage, or 0.0 if no eyewear label appears;
glasses-detector probability * 100). Requires Python 3.10+ with tensorflow (or
tensorflow-macos) and glasses-detector installed. See
tentative_eyewear_model_testing.ipynb for background on VGG16 limits and
accuracy comparison.

Note: glasses-detector==0.1.1's AnyglassesClassifier is unusable — its
EyeglassesClassifier half has no published pretrained weights in this release
line (VERSION_MAP maps it to an unversioned URL that 404s). We use
SunglassesClassifier directly instead, whose small-model weights do exist
(v0.1.0 release assets). This means the glasses-detector column only ever
detects sunglasses, not clear prescription glasses.

Usage (from testing/): python evaluate_glasses_detector.py
"""

from __future__ import annotations

import os
import sys

import pandas as pd
import torch
from tensorflow.keras.applications.vgg16 import VGG16, decode_predictions, preprocess_input
from tensorflow.keras.preprocessing.image import img_to_array, load_img

# glasses-detector==0.1.1 downloads pretrained weights via
# torch.hub.load_state_dict_from_url(url, map_location=device) where device
# defaults to None with no constructor kwarg to override it. The published
# checkpoints were saved from CUDA tensors, so map_location=None crashes on a
# CPU-only machine. Force CPU deserialization globally before instantiating
# any classifier below.
_original_load_state_dict_from_url = torch.hub.load_state_dict_from_url


def _load_state_dict_from_url_cpu(url, *args, **kwargs):
    kwargs["map_location"] = torch.device("cpu")
    return _original_load_state_dict_from_url(url, *args, **kwargs)


torch.hub.load_state_dict_from_url = _load_state_dict_from_url_cpu

try:
    from glasses_detector import SunglassesClassifier
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

# ImageNet has only these eyewear classes in VGG16 decode_predictions output
# (same rule as backend/all_models.py's EYEWEAR_IMAGENET_LABELS).
EYEWEAR_IMAGENET_LABELS = frozenset({"sunglasses", "sunglass"})


def load_classifier() -> SunglassesClassifier:
    classifier = SunglassesClassifier(base_model="small", pretrained=True)
    classifier.eval()
    return classifier


def load_vgg16_model() -> VGG16:
    return VGG16()


def predict_percent(classifier: SunglassesClassifier, image_path: str) -> float:
    probability = classifier.predict(image_path, label_type="proba")
    return round(float(probability) * 100, 2)


def vgg16_eyewear_percent(model: VGG16, image_path: str) -> float:
    image = load_img(image_path, target_size=(224, 224))
    image = img_to_array(image)
    image = image.reshape((1, image.shape[0], image.shape[1], image.shape[2]))
    image = preprocess_input(image)
    yhat = model.predict(image, verbose=0)
    for _, label, prob in decode_predictions(yhat)[0]:
        if label in EYEWEAR_IMAGENET_LABELS:
            return round(float(prob) * 100, 2)
    return 0.0


def file_size_kb(image_path: str) -> float:
    return round(os.path.getsize(image_path) / 1024, 2)


def evaluate_csv(
    vgg16_model: VGG16, classifier: SunglassesClassifier, input_csv: str, output_csv: str
) -> pd.DataFrame:
    source = pd.read_csv(input_csv)
    if "Name" not in source.columns:
        raise ValueError(f"{input_csv} must contain a Name column")

    rows = []
    missing = []

    for _, row in source.iterrows():
        filename = row["Name"]
        image_path = os.path.join(IMAGES_DIR, filename)

        if not os.path.isfile(image_path):
            missing.append(filename)
            rows.append(
                {
                    "Name": filename,
                    "Size (KB)": row["Size (KB)"] if "Size (KB)" in source.columns else None,
                    "VGG16": 0.0,
                    "glasses-detector": 0.0,
                }
            )
            continue

        rows.append(
            {
                "Name": filename,
                "Size (KB)": file_size_kb(image_path),
                "VGG16": vgg16_eyewear_percent(vgg16_model, image_path),
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
        print(f"  missing from {IMAGES_DIR}: {len(missing)} (VGG16/glasses-detector set to 0.0)")
        for name in missing[:5]:
            print(f"    - {name}")
        if len(missing) > 5:
            print("    ...")

    return result


def main() -> int:
    if not os.path.isdir(IMAGES_DIR):
        print(f"Expected image directory not found: {IMAGES_DIR}", file=sys.stderr)
        return 1

    print("Loading VGG16 (ImageNet)...")
    vgg16_model = load_vgg16_model()

    print("Loading SunglassesClassifier (small, pretrained)...")
    classifier = load_classifier()

    for input_csv, output_csv in INPUT_OUTPUT_PAIRS:
        if not os.path.isfile(input_csv):
            print(f"Skipping missing input CSV: {input_csv}", file=sys.stderr)
            continue
        print(f"\nEvaluating {os.path.basename(input_csv)} ...")
        evaluate_csv(vgg16_model, classifier, input_csv, output_csv)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
