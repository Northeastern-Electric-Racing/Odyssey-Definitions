import json
from pathlib import Path
import sys


ID_FIELDS = ("request_id", "response_id", "write_data_id", "boot_request_id")


def can_id(value):
    return (value["is_ext"], int(value["id"], 16) if isinstance(value["id"], str) else value["id"])


def validate(directory, config_path):
    errors = []
    try:
        config = json.loads(config_path.read_text())
    except (OSError, json.JSONDecodeError) as error:
        return [f"{config_path.name}: Could not read reserved IDs: {error}"]
    reserved = {}
    boot_entries = {}
    for name, ecu in config["ecus"].items():
        # Descriptions use spaces; ECU keys use underscores.
        description = f"{name.replace('_', ' ')} Boot Request".casefold()
        for role in ID_FIELDS:
            key = can_id(ecu["can"][role])
            if key in reserved:
                errors.append(f"{config_path.name}: Duplicate reserved CAN ID 0x{key[1]:03X} for {name}")
            else:
                reserved[key] = (name, role)
            if role == "boot_request_id":
                boot_entries[description] = key
    for path in sorted(directory.glob("*.json")):
        try:
            messages = json.loads(path.read_text())
        except (OSError, json.JSONDecodeError) as error:
            errors.append(f"{path.name}: Could not check reserved IDs: {error}")
            continue
        for message in messages:
            if "id" not in message:
                continue
            key = (message.get("is_ext", False), int(message["id"], 16))
            description = message["desc"]
            location = f"{path.name}: {description}"
            expected = boot_entries.get(description.casefold()) if path.name == "ajax.json" else None
            if expected is not None and key != expected:
                errors.append(f"{location}: Boot request ID or frame format does not match ecus.json")
            reservation = reserved.get(key)
            if reservation:
                name, role = reservation
                allowed = expected == key and role == "boot_request_id"
                if not allowed:
                    frame = "Extended" if key[0] else "Standard"
                    errors.append(
                        f"{location}: {frame} CAN ID 0x{key[1]:03X} is reserved for {name} bootloader traffic."
                    )
    return errors


def main():
    root = Path(__file__).resolve().parents[1]
    errors = validate(root / "can-messages", root / "can-bootloader/ecus.json")
    if errors:
        print("Reserved CAN ID check failed:\n" + "\n".join(errors), file=sys.stderr)
    else:
        print("No conflicts found with reserved CAN IDs.")
    return bool(errors)


if __name__ == "__main__":
    sys.exit(main())
