#!/usr/bin/env python3
"""
TSC TE244 Label Printer Helper
Reads TSPL commands from stdin or file, sends to Windows printer via win32print.
Usage:
    python print_tsc.py <printer_name> <tspl_file>
    OR
    python print_tsc.py <printer_name> -    (reads TSPL from stdin)
"""

import sys
import os

try:
    import win32print
except ImportError:
    print("ERROR: pywin32 not installed. Run: pip install pywin32", file=sys.stderr)
    sys.exit(2)


def send_to_printer(printer_name, tspl_bytes):
    """Send raw bytes directly to a Windows printer."""
    hprinter = win32print.OpenPrinter(printer_name)
    try:
        job = win32print.StartDocPrinter(hprinter, 1, ("Alankar Label", None, "RAW"))
        win32print.StartPagePrinter(hprinter)
        win32print.WritePrinter(hprinter, tspl_bytes)
        win32print.EndPagePrinter(hprinter)
        win32print.EndDocPrinter(hprinter)
        return True
    finally:
        win32print.ClosePrinter(hprinter)


def main():
    if len(sys.argv) != 3:
        print("Usage: python print_tsc.py <printer_name> <tspl_file_or_->", file=sys.stderr)
        sys.exit(1)

    printer_name = sys.argv[1]
    source = sys.argv[2]

    # Read TSPL data
    if source == "-":
        # Read from stdin
        if sys.stdin.isatty():
            print("ERROR: No stdin data provided", file=sys.stderr)
            sys.exit(1)
        tspl_bytes = sys.stdin.buffer.read()
    else:
        # Read from file
        if not os.path.isfile(source):
            print(f"ERROR: File not found: {source}", file=sys.stderr)
            sys.exit(1)
        with open(source, "rb") as f:
            tspl_bytes = f.read()

    if not tspl_bytes:
        print("ERROR: TSPL data is empty", file=sys.stderr)
        sys.exit(1)

    # Send to printer
    try:
        send_to_printer(printer_name, tspl_bytes)
        print(f"OK: Sent {len(tspl_bytes)} bytes to '{printer_name}'")
        sys.exit(0)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(3)


if __name__ == "__main__":
    main()
