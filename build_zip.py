"""Собирает scenario.zip для загрузки в SmartApp Studio.
Запускать из папки scenario/:  python build_zip.py
"""
import os
import zipfile

OUTPUT = "scenario.zip"

EXCLUDE_FILES = {".empty", "scenario.zip"}
EXCLUDE_SC = {"addItem.sc", "deleteItem.sc"}

with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED) as zf:
    for item in ("chatbot.yaml", "caila_import.json"):
        zf.write(item)
    for folder in ("src", "test"):
        for root, _, files in os.walk(folder):
            for fname in files:
                if fname in EXCLUDE_FILES:
                    continue
                if fname in EXCLUDE_SC:
                    continue
                zf.write(os.path.join(root, fname))

print(f"Создан {OUTPUT} — загрузите в SmartApp Studio (Code for SmartApp).")
