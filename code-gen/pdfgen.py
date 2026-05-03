"""
pdfgen.py
Render all CANGEN JSON spec files from ../can-messages/ into a single HTML (+ optional PDF).

Usage:
    python pdfgen.py
    python pdfgen.py --pdf          # requires weasyprint
    python pdfgen.py --output out.html
"""

import argparse
import base64
import json
import subprocess
from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape


# ── Helpers ───────────────────────────────────────────────────────────────────

def load_specs(*paths: str) -> list[dict]:
    """Load and merge any number of CANGEN JSON files into one message list."""
    messages = []
    for p in paths:
        full = Path(p).resolve()
        if not full.exists():
            print(f"⚠  Skipping missing file: {full}")
            continue
        data = json.loads(full.read_text())
        if isinstance(data, list):
            messages.extend(data)
        else:
            raise ValueError(f"{p} must contain a JSON array at the top level")
    return messages


def active_point_count(msg: dict) -> int:
    """Count points where parse != false."""
    return sum(
        1 for pt in msg.get("points", [])
        if pt.get("parse", True) is not False
    )


def enrich(messages: list[dict]) -> list[dict]:
    """Attach derived fields useful in the template."""
    for msg in messages:
        msg["_active_points"] = active_point_count(msg)
    return messages


def git_hash(repo_path: Path) -> str:
    """Return the short git hash of HEAD, or 'unknown' if unavailable."""
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=repo_path, stderr=subprocess.DEVNULL
        ).decode().strip()
    except Exception:
        return "unknown"


def logo_data_uri(template_dir: Path):
    """
    Look for a logo file in the templates directory and return a base64
    data URI so the PDF is fully self-contained.
    Supported: logo.svg, logo.png, logo.jpg, logo.jpeg, logo.webp
    Place your logo at: code-gen/templates/logo.<ext>
    """
    mime_map = {
        "svg":  "image/svg+xml",
        "png":  "image/png",
        "jpg":  "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
    }
    for ext, mime in mime_map.items():
        path = template_dir / f"logo.{ext}"
        if path.exists():
            b64 = base64.b64encode(path.read_bytes()).decode()
            return f"data:{mime};base64,{b64}"
    return None


# ── Rendering ─────────────────────────────────────────────────────────────────

def render(template_path: str, messages: list[dict]) -> str:
    tpl_file = Path(template_path).resolve()
    logo     = logo_data_uri(tpl_file.parent.parent)

    env = Environment(
        loader=FileSystemLoader(str(tpl_file.parent)),
        autoescape=select_autoescape(["html"]),
    )

    from markupsafe import Markup
    import re

    def highlight_indices(value: str) -> Markup:
        result = re.sub(
            r"\{(\d+)\}",
            r'<em style="color:#e63946">{\1}</em>',
            str(value),
        )
        return Markup(result)

    env.filters["highlight_indices"] = highlight_indices

    template = env.get_template(tpl_file.name)
    return template.render(
        messages=messages,
        generation_date=datetime.now().strftime("%Y-%m-%d %H:%M"),
        git_hash=git_hash(tpl_file.parent.parent),
        logo_uri=logo,
    )


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Render CANGEN spec to HTML/PDF")
    parser.add_argument(
        "--template",
        default=str(Path(__file__).resolve().parent / "templates" / "can_spec_template.html.j2"),
        help="Jinja2 template file (default: ./templates/can_spec_template.html.j2)",
    )
    parser.add_argument(
        "--output", default="can_spec.html",
        help="Output HTML file (default: can_spec.html)",
    )
    parser.add_argument(
        "--pdf", action="store_true",
        help="Also export a PDF alongside the HTML (requires weasyprint)",
    )
    args = parser.parse_args()

    can_dir = Path(__file__).resolve().parent.parent / "can-messages"
    spec_paths = sorted(str(f) for f in can_dir.glob("*.json"))
    print(f"Loading {len(spec_paths)} spec file(s) from {can_dir}")

    messages = enrich(load_specs(*spec_paths))
    html = render(args.template, messages)

    out = Path(args.output)
    out.write_text(html, encoding="utf-8")
    print(f"✔  HTML written → {out}")

    if args.pdf:
        try:
            from weasyprint import HTML as WPHTML
            pdf_path = out.with_suffix(".pdf")
            WPHTML(filename=str(out)).write_pdf(str(pdf_path))
            print(f"✔  PDF written  → {pdf_path}")
        except ImportError:
            print("✘  weasyprint not installed — run: pip install weasyprint")


if __name__ == "__main__":
    main()
