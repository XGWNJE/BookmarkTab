#!/usr/bin/env python3
"""
BookmarkTab Eval Runner — code-based grader for regression evals.
Usage: python evals/run.py [--capability C1] [--regression R1] [--all]
"""
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EVALS_DIR = ROOT / "evals"

# ============================================================
# R1: Module Import Chain Integrity
# ============================================================
def check_r1_module_imports():
    results = []
    js_files = list(ROOT.glob("**/*.js"))
    
    for f in sorted(js_files):
        rel = str(f.relative_to(ROOT))
        content = f.read_text(encoding="utf-8")
        imports = re.findall(r"^import\s+.+?from\s+['\"](.+?)['\"]", content, re.MULTILINE)
        for imp in imports:
            resolved = (f.parent / imp).resolve()
            if not resolved.exists():
                results.append(f"FAIL: {rel} imports '{imp}' — file not found")
            else:
                results.append(f"PASS: {rel} imports '{imp}'")
    
    failures = [r for r in results if r.startswith("FAIL")]
    return {
        "name": "R1: Module Import Chain Integrity",
        "total": len(results),
        "passed": len(results) - len(failures),
        "failed": len(failures),
        "failures": failures,
        "pass": len(failures) == 0
    }


# ============================================================
# R2: Event Contract Integrity
# ============================================================
def check_r2_event_contracts():
    results = []
    all_js = list(ROOT.glob("**/*.js"))
    
    # Collect all emit and on calls
    emits = {}   # event_name -> [file]
    ons = {}     # event_name -> [file]
    
    for f in all_js:
        rel = str(f.relative_to(ROOT))
        content = f.read_text(encoding="utf-8")
        for m in re.finditer(r"EventBus\.emit\(['\"]([^'\"]+)['\"]", content):
            event = m.group(1)
            emits.setdefault(event, []).append(rel)
        for m in re.finditer(r"EventBus\.on\(['\"]([^'\"]+)['\"]", content):
            event = m.group(1)
            ons.setdefault(event, []).append(rel)
    
    # Every emitted event should have at least one listener
    for event, files in sorted(emits.items()):
        if event in ons:
            results.append(f"PASS: '{event}' emitted by {files} → consumed by {ons[event]}")
        else:
            results.append(f"WARN: '{event}' emitted by {files} → NO LISTENER FOUND")
    
    # Every listened event should have at least one emitter (except chrome API-driven ones)
    chrome_driven = {"created", "removed", "changed", "moved", "childrenReordered", "navigate"}
    for event, files in sorted(ons.items()):
        if event not in emits and event not in chrome_driven:
            results.append(f"WARN: '{event}' listened by {files} → NO EMITTER FOUND")
    
    warnings = [r for r in results if r.startswith("WARN")]
    passes = [r for r in results if r.startswith("PASS")]
    return {
        "name": "R2: Event Contract Integrity",
        "total": len(results),
        "passed": len(passes),
        "warnings": len(warnings),
        "warning_details": warnings,
        "pass": len(warnings) == 0
    }


# ============================================================
# R3: CSS Module Architecture
# ============================================================
def check_r3_css_modules():
    results = []
    main_css = ROOT / "css" / "main.css"
    modules_dir = ROOT / "css" / "modules"
    
    if not main_css.exists():
        return {"name": "R3", "pass": False, "failures": ["main.css not found"]}
    
    content = main_css.read_text(encoding="utf-8")
    imported = re.findall(r"@import\s+['\"](.+?)['\"]", content)
    actual_files = [f"modules/{f.name}" for f in sorted(modules_dir.glob("*.css"))]
    normalized_imports = []
    
    for imp in imported:
        normalized = imp.lstrip("./")
        normalized_imports.append(normalized)
        if normalized in actual_files:
            results.append(f"PASS: main.css imports '{imp}' — file exists")
        else:
            results.append(f"FAIL: main.css imports '{imp}' — file not found")
    
    for af in actual_files:
        if af not in normalized_imports:
            results.append(f"WARN: '{af}' exists but not imported by main.css")
    
    failures = [r for r in results if r.startswith("FAIL")]
    return {
        "name": "R3: CSS Module Architecture",
        "total": len(results),
        "passed": len(results) - len(failures),
        "failed": len(failures),
        "failures": failures,
        "pass": len(failures) == 0
    }


# ============================================================
# C1 (partial): EventBus code structure check
# ============================================================
def check_c1_eventbus_structure():
    results = []
    f = ROOT / "core" / "EventBus.js"
    content = f.read_text(encoding="utf-8")
    
    checks = {
        "Has 'listeners' Map": "this.listeners = new Map()",
        "Has on() method": "on(event, callback)",
        "Has off() method": "off(event, callback)",
        "Has emit() method": "emit(event, data)",
        "Has once() method": "once(event, callback)",
        "Returns unsubscribe from on()": "return () => this.off",
        "Try/catch in emit()": "try {",
        "Delete from Set in off()": ".delete(callback)",
    }
    
    for label, pattern in checks.items():
        if pattern in content:
            results.append(f"PASS: {label}")
        else:
            results.append(f"FAIL: {label} — pattern '{pattern}' not found")
    
    failures = [r for r in results if r.startswith("FAIL")]
    return {
        "name": "C1: EventBus Code Structure",
        "total": len(results),
        "passed": len(results) - len(failures),
        "failed": len(failures),
        "failures": failures,
        "pass": len(failures) == 0
    }


# ============================================================
# C7: SVG Security Sanitization (code structure check)
# ============================================================
def check_c7_svg_sanitization():
    results = []
    card = ROOT / "components" / "BookmarkCard.js"
    content = card.read_text(encoding="utf-8")
    
    checks = {
        "DOMParser usage": "DOMParser",
        "Removes script tags": "script",
        "Removes on* handlers": "on\\w+",
        "Removes javascript: URLs": "javascript",
        "Removes data: URLs": "data",
    }
    
    for label, pattern in checks.items():
        if re.search(pattern, content):
            results.append(f"PASS: {label} — pattern found")
        else:
            results.append(f"FAIL: {label} — pattern '{pattern}' not found")
    
    failures = [r for r in results if r.startswith("FAIL")]
    return {
        "name": "C7: SVG Security Sanitization (code structure)",
        "total": len(results),
        "passed": len(results) - len(failures),
        "failed": len(failures),
        "failures": failures,
        "pass": len(failures) == 0
    }


# ============================================================
# Main
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description="BookmarkTab Eval Runner")
    parser.add_argument("--all", action="store_true", help="Run all evals")
    parser.add_argument("--regression", action="store_true", help="Run regression evals only")
    parser.add_argument("--capability", action="store_true", help="Run capability evals only")
    args = parser.parse_args()
    
    if not (args.all or args.regression or args.capability):
        args.all = True  # default
    
    all_results = []
    
    if args.all or args.regression:
        all_results.append(check_r1_module_imports())
        all_results.append(check_r2_event_contracts())
        all_results.append(check_r3_css_modules())
    
    if args.all or args.capability:
        all_results.append(check_c1_eventbus_structure())
        all_results.append(check_c7_svg_sanitization())
    
    # Print report
    total_pass = 0
    total_eval = 0
    print("=" * 60)
    print("  BookmarkTab Eval Report")
    print("=" * 60)
    
    for r in all_results:
        total_eval += 1
        status = "[PASS]" if r["pass"] else "[FAIL]"
        print(f"\n{status}  {r['name']}")
        print(f"       {r.get('passed', 0)}/{r.get('total', 0)} checks passed")
        
        for detail in r.get("failures", []) + r.get("warning_details", []):
            print(f"       -> {detail}")
        
        if r["pass"]:
            total_pass += 1
    
    print(f"\n{'=' * 60}")
    print(f"  Overall: {total_pass}/{total_eval} evals passed")
    print(f"{'=' * 60}")
    
    sys.exit(0 if total_pass == total_eval else 1)


if __name__ == "__main__":
    main()
