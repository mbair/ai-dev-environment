#!/usr/bin/env python3
"""Validate selected NFC Reserve translation keys across hu/gb/de locales."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


LOCALES = ("hu", "gb", "de")
MISSING = object()


def nested_value(data: dict[str, Any], key: str) -> Any:
    current: Any = data
    for segment in key.split("."):
        if not isinstance(current, dict) or segment not in current:
            return MISSING
        current = current[segment]
    return current


def flatten_leaves(value: Any, prefix: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        return {prefix: value}
    leaves: dict[str, Any] = {}
    for name, child in value.items():
        child_prefix = f"{prefix}.{name}" if prefix else name
        leaves.update(flatten_leaves(child, child_prefix))
    return leaves


def selected_keys(
    documents: dict[str, dict[str, Any]], keys: list[str], prefixes: list[str]
) -> list[str]:
    selected = set(keys)
    for prefix in prefixes:
        found = False
        for document in documents.values():
            value = nested_value(document, prefix)
            if value is MISSING:
                continue
            selected.update(flatten_leaves(value, prefix))
            found = True
        if not found:
            raise ValueError(f"Prefix does not resolve as a nested key: {prefix}")
    return sorted(selected)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate selected translation keys in hu.json, gb.json and de.json."
    )
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--key", action="append", default=[])
    parser.add_argument("--prefix", action="append", default=[])
    args = parser.parse_args()

    if not args.key and not args.prefix:
        parser.error("provide at least one --key or --prefix")

    locale_dir = args.root / "src" / "assets" / "i18n"
    documents: dict[str, dict[str, Any]] = {}
    for locale in LOCALES:
        path = locale_dir / f"{locale}.json"
        try:
            documents[locale] = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            print(f"ERROR {path}: {error}")
            return 1

    try:
        keys = selected_keys(documents, args.key, args.prefix)
    except ValueError as error:
        print(f"ERROR: {error}")
        return 1

    errors: list[str] = []
    for key in keys:
        structural_modes = set()
        for locale, document in documents.items():
            nested = nested_value(document, key)
            direct = document.get(key, MISSING)
            root_is_object = isinstance(document.get(key.split(".", 1)[0]), dict)

            if root_is_object:
                structural_modes.add("nested")
                if nested is MISSING:
                    errors.append(
                        f"{locale}: {key} is missing from the nested object"
                        + (" (a legacy flat entry exists)" if direct is not MISSING else "")
                    )
                    continue
                value = nested
                if direct is not MISSING:
                    if direct != nested:
                        errors.append(
                            f"{locale}: {key} has conflicting flat and nested values"
                        )
                    else:
                        errors.append(
                            f"{locale}: {key} redundantly exists as both a flat and nested key"
                        )
            else:
                structural_modes.add("flat")
                value = direct
                if value is MISSING:
                    errors.append(f"{locale}: {key} is missing")
                    continue

            if isinstance(value, str) and not value.strip():
                errors.append(f"{locale}: {key} is empty")
            elif isinstance(value, dict):
                errors.append(f"{locale}: {key} resolves to an object, not a leaf value")

        if len(structural_modes) > 1:
            errors.append(f"{key}: locales use inconsistent flat/nested structures")

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    print(f"OK: validated {len(keys)} key(s) across {', '.join(LOCALES)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
