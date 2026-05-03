**The PDFGEN used AI for HTML development**

Now here's the companion Python script to drive the template:Here's a breakdown of what was built and why each piece works the way it does.

---

**Template structure (`can_spec_template.html.j2`)**

The template is divided into four major sections:

- **Cover page** — generated date and message count are injected via `{{ generation_date }}` and `{{ messages | length }}`, giving a printable title page automatically.
- **Table of contents** — a `{% for msg in messages %}` loop with a `selectattr` filter to count only active (non-padding) points per message, so the TOC is meaningful at a glance.
- **Per-message sections** — each message gets its own block with two tables:
  - *MQTT Topics / Net Fields* — this is the human-focus table. It shows the full topic path (with runtime-embedded indices like `{1}` rendered in red), unit, `doc` string, the optional `desc` warning field, and a compact summary of which CANPoints feed it.
  - *CAN Point Layout* — the raw bit-level table, showing size, c_type, endianness, formatter (e.g. `divide(10)`), signed flag, and a sim summary (sweep range or enum probability table).
- **Encodable defaults block** — only rendered when at least one point carries `default_value`, avoiding clutter on decode-only messages.

**Key Jinja2 patterns used**

| Pattern | Purpose |
|---|---|
| `{% set ns = namespace(has_defaults=false) %}` | Jinja2's scoping workaround — lets a flag set inside a loop be visible outside it |
| `msg.points[v - 1]` | Dereferences the 1-indexed `values` list from a NetField back to its Point, so the field table can inline the point's size/type without a separate loop |
| `selectattr("parse", "ne", false)` | Filters out padding points when counting active signals |
| `pt.formatter.key == "divide"` | Renders formatters like `divide(10)` vs just a raw key name |

**Rendering pipeline (`render_spec.py`)**

Pass one or more JSON files and they're merged into a single report. The `--pdf` flag hands the finished HTML to **WeasyPrint**, which respects the `@page` and `page-break-before: always` CSS rules so every message starts on a fresh page in the PDF.
