import json
import os
import time
from datetime import datetime

from dotenv import load_dotenv
from google import genai
from google.genai import errors

from all_models import _dfd_zone, _dfd_verdict, _format_runtime
from helper_functions import write_ai_result_json

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

load_dotenv(os.path.join(BACKEND_DIR, ".env"))

GEMINI_MODEL = "gemini-3-flash-preview"
GEMINI_TEST_PROMPT = (
    "In one paragraph, explain your own capabilities as a multimodal AI model. "
    "In a second paragraph, explain your understanding of deepfake detection — "
    "what visual, audio, and behavioral signals can indicate a video has been "
    "manipulated or AI-generated."
)

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
    '''
    Populate the Gemini prompt placeholders from the most recent run_backend.py run.

    Args:
        results_path: path to result_update.json. Defaults to AllResults/result_update.json.
        eyeblink_example_path: path to eyeblink_example.png. Defaults to the standard
                                current_upload/temp/gemini location.

    Returns:
        Dict of all 13 prompt placeholders (see ai_model_placeholders), with the
        result_update.json-derived fields, dfd_zone/dfd_verdict, and
        eyeblink_example_status filled in from the current filesystem state. Falls
        back to the default values (with a printed warning) if result_update.json
        is missing, stale, or malformed.
    '''
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
    '''
    Format a byte count as a short human-readable string.

    Args:
        num_bytes: file size in bytes.

    Returns:
        String like "512 B", "97 KB", or "16.8 MB".
    '''
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
    '''
    Check and print the existence (and size) of every file Gemini's prompt can attach.

    Args:
        subject_reference_path: path to subject_reference.png (necessary).
        target_video_path: path to target.mp4 (necessary).
        eyeblink_csv_path: path to eyeblink_data.csv (necessary).
        eyeblink_example_path: path to eyeblink_example.png (optional — a video where
                                the subject never blinks won't produce this file).

    Returns:
        Tuple (all_necessary_present, missing_necessary_filenames): the first is
        True only if every necessary file exists; the second lists the filenames
        (not full paths) of any missing necessary files, for building a message.
        Prints a summary line if any necessary file is missing.
    '''
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

    missing_necessary = []
    for name, path, requirement in files:
        exists = os.path.exists(path)
        size_str = f" ({_format_file_size(os.path.getsize(path))})" if exists else ""
        print(f"{name} ({requirement}): {'exists' if exists else 'missing'}{size_str}")
        if requirement == "necessary" and not exists:
            missing_necessary.append(name)

    if missing_necessary:
        print("Required files for AI are missing. Skipping AI API call request.")
        return False, missing_necessary

    return True, []


def _call_gemini(prompt, api_key):
    '''
    Send a single text-only request to Gemini and return the response text.

    Uses the official google-genai SDK. No "tools" are configured, so no Google
    Search grounding, code execution, or function calling is enabled for this
    request.

    Args:
        prompt: text prompt to send.
        api_key: Gemini API key.

    Returns:
        The response text.

    Raises:
        google.genai.errors.APIError: Gemini returned an HTTP error (e.g. bad
        API key, rate limit) — carries `.code` and `.message`.
        ValueError: response had no usable text (e.g. blocked/empty content).
    '''
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
    return response.text


def send_gemini_test_prompt():
    '''
    Send the Gemini test prompt and print the result to the terminal.

    Prints start time, end time, and total runtime the same way run_backend.py
    does, followed by the response text (or an error message on failure).

    Returns:
        Nothing.
    '''
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("send_gemini_test_prompt() error: GEMINI_API_KEY is not set in backend/.env.")
        return

    print("start time: " + datetime.now().strftime("%H:%M:%S"))
    start_perf = time.perf_counter()

    try:
        text = _call_gemini(GEMINI_TEST_PROMPT, api_key)
    except (errors.APIError, ValueError) as exc:
        print("end time: " + datetime.now().strftime("%H:%M:%S"))
        print("total runtime: " + _format_runtime(time.perf_counter() - start_perf))
        print(f"send_gemini_test_prompt() error: Gemini API request failed: {exc}")
        return

    print("end time: " + datetime.now().strftime("%H:%M:%S"))
    print("total runtime: " + _format_runtime(time.perf_counter() - start_perf))
    print("Gemini response:")
    print(text)


def run_gemini_analysis(ai_results_path):
    '''
    Run the Gemini test prompt as part of run_backend.py and write the outcome
    to ai_result_update.json for the frontend to poll.

    Still sends the placeholder GEMINI_TEST_PROMPT rather than the full
    deepfake-analysis prompt/attachments — that integration is future work.
    Prints start time, end time, and total runtime the same way
    send_gemini_test_prompt() does.

    Args:
        ai_results_path: path to write ai_result_update.json to.

    Returns:
        Nothing.
    '''
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        message = "GEMINI_API_KEY is not set in backend/.env."
        print(f"run_gemini_analysis() error: {message}")
        write_ai_result_json({
            "status": "error",
            "gemini_response": "",
            "runtime": 0,
            "error_message": message,
        }, ai_results_path)
        return

    print("start time: " + datetime.now().strftime("%H:%M:%S"))
    start_perf = time.perf_counter()

    try:
        text = _call_gemini(GEMINI_TEST_PROMPT, api_key)
    except (errors.APIError, ValueError) as exc:
        runtime = time.perf_counter() - start_perf
        message = f"Gemini API request failed: {exc}"
        print("end time: " + datetime.now().strftime("%H:%M:%S"))
        print("total runtime: " + _format_runtime(runtime))
        print(f"run_gemini_analysis() error: {message}")
        write_ai_result_json({
            "status": "error",
            "gemini_response": "",
            "runtime": runtime,
            "error_message": message,
        }, ai_results_path)
        return

    runtime = time.perf_counter() - start_perf
    print("end time: " + datetime.now().strftime("%H:%M:%S"))
    print("total runtime: " + _format_runtime(runtime))
    print("Gemini response:")
    print(text)
    write_ai_result_json({
        "status": "complete",
        "gemini_response": text,
        "runtime": runtime,
        "error_message": "",
    }, ai_results_path)


if __name__ == "__main__":
    send_gemini_test_prompt()
