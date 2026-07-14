import json
import os
import time

from all_models import _dfd_zone, _dfd_verdict

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_RESULTS_PATH = os.path.join(BACKEND_DIR, "AllResults", "result_update.json")
DEFAULT_EYEBLINK_EXAMPLE_PATH = os.path.join(
    BACKEND_DIR, "current_upload", "temp", "gemini", "eyeblink_example.png"
)
DEFAULT_SUBJECT_REFERENCE_PATH = os.path.join(
    BACKEND_DIR, "current_upload", "temp", "subject_reference.png"
)
DEFAULT_TARGET_VIDEO_PATH = os.path.join(BACKEND_DIR, "current_upload", "target.mp4")
DEFAULT_EYEBLINK_CSV_PATH = os.path.join(BACKEND_DIR, "AllResults", "eyeblink_data.csv")

STALE_RESULTS_WARNING_SECONDS = 300  # 5 minutes

ai_model_placeholders = {
    "eyeblink_example_status": False,       # no result_update.json equivalent
    "DFD": 0,                               # matches result_update.json[0]["DFD"]
    "dfd_zone": "",                         # no result_update.json equivalent (derived)
    "dfd_verdict": "",                      # no result_update.json equivalent (derived)
    "age_min": 0,                           # matches result_update.json[2]["age_min"]
    "age_max": 0,                           # matches result_update.json[2]["age_max"]
    "gender_man_score": 0,                  # matches result_update.json[2]["gender_man_score"]
    "gender_woman_score": 0,                # matches result_update.json[2]["gender_woman_score"]
    "open": 0,                              # matches result_update.json[1]["open"]
    "closed": 0,                            # matches result_update.json[1]["closed"]
    "unknown": 0,                           # matches result_update.json[1]["unknown"]
    "missing": 0,                           # matches result_update.json[1]["missing"]
    "shades": False,                        # matches result_update.json[3]["shades"]
}


def build_ai_model_placeholders(results_path=None, eyeblink_example_path=None):
    results_path = results_path or DEFAULT_RESULTS_PATH
    eyeblink_example_path = eyeblink_example_path or DEFAULT_EYEBLINK_EXAMPLE_PATH

    placeholders = dict(ai_model_placeholders)

    try:
        age_seconds = time.time() - os.path.getmtime(results_path)
        if age_seconds > STALE_RESULTS_WARNING_SECONDS:
            print(
                f"build_ai_model_placeholders() warning: {results_path} was last written "
                f"{age_seconds / 60:.1f} minutes ago — this run may have failed before "
                "writing fresh results, so the values below could be stale."
            )

        with open(results_path) as f:
            data = json.load(f)
        dfd, blink, age_gender, shades = data[0], data[1], data[2], data[3]

        placeholders["DFD"] = dfd["DFD"]
        placeholders["dfd_zone"] = _dfd_zone(dfd["DFD"])
        placeholders["dfd_verdict"] = _dfd_verdict(dfd["DFD"])

        placeholders["age_min"] = age_gender["age_min"]
        placeholders["age_max"] = age_gender["age_max"]
        placeholders["gender_man_score"] = age_gender["gender_man_score"]
        placeholders["gender_woman_score"] = age_gender["gender_woman_score"]

        placeholders["open"] = blink["open"]
        placeholders["closed"] = blink["closed"]
        placeholders["unknown"] = blink["unknown"]
        placeholders["missing"] = blink["missing"]

        placeholders["shades"] = bool(shades["shades"])
    except (OSError, ValueError, KeyError, IndexError) as exc:
        print(f"build_ai_model_placeholders() warning: could not read {results_path} ({exc}). "
              "Leaving result_update.json-derived fields at their defaults.")

    placeholders["eyeblink_example_status"] = os.path.exists(eyeblink_example_path)

    return placeholders


def _format_file_size(num_bytes):
    if num_bytes < 1024:
        return f"{num_bytes} B"
    kb = num_bytes / 1024
    if kb < 1024:
        return f"{kb:.0f} KB"
    mb = kb / 1024
    return f"{mb:.1f} MB"


def check_gemini_inputs_exist(
    subject_reference_path=None,
    target_video_path=None,
    eyeblink_csv_path=None,
    eyeblink_example_path=None,
):
    subject_reference_path = subject_reference_path or DEFAULT_SUBJECT_REFERENCE_PATH
    target_video_path = target_video_path or DEFAULT_TARGET_VIDEO_PATH
    eyeblink_csv_path = eyeblink_csv_path or DEFAULT_EYEBLINK_CSV_PATH
    eyeblink_example_path = eyeblink_example_path or DEFAULT_EYEBLINK_EXAMPLE_PATH

    files = [
        ("subject_reference.png", subject_reference_path, "necessary"),
        ("target.mp4", target_video_path, "necessary"),
        ("eyeblink_data.csv", eyeblink_csv_path, "necessary"),
        ("eyeblink_example.png", eyeblink_example_path, "optional"),
    ]

    all_necessary_present = True
    for name, path, requirement in files:
        exists = os.path.exists(path)
        size_str = f" ({_format_file_size(os.path.getsize(path))})" if exists else ""
        print(f"{name} ({requirement}): {'exists' if exists else 'missing'}{size_str}")
        if requirement == "necessary" and not exists:
            all_necessary_present = False

    if not all_necessary_present:
        print("Required files for AI are missing. Skipping AI API call request.")
        return False

    return True
