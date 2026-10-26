import json
from pathlib import Path
import sys


BOOTLOADER_IDS = {
    "BMS": {"is_ext": False, "request_id": 0x010, "response_id": 0x011, "write_data_id": 0x012, "boot_request_id": 0x013},
    "VCU": {"is_ext": False, "request_id": 0x014, "response_id": 0x015, "write_data_id": 0x016, "boot_request_id": 0x017},
    "Lightning": {"is_ext": False, "request_id": 0x040, "response_id": 0x041, "write_data_id": 0x042, "boot_request_id": 0x043},
    "MSB Front": {"is_ext": False, "request_id": 0x044, "response_id": 0x045, "write_data_id": 0x046, "boot_request_id": 0x047},
    "MSB Back": {"is_ext": False, "request_id": 0x048, "response_id": 0x049, "write_data_id": 0x04A, "boot_request_id": 0x04B},
}


RESERVED_IDS = {
    (config["is_ext"], config[role]): (ecu, role == "boot_request_id")
    for ecu, config in BOOTLOADER_IDS.items()
    for role in ("request_id", "response_id", "write_data_id", "boot_request_id")
}


def validate(directory):
    errors = []
    for path in sorted(directory.glob("*.json")):
        try:
            messages = json.loads(path.read_text())
        except (OSError, ValueError) as error:
            errors.append(f"{path.name}: Could not check reserved IDs: {error}")
            continue
        for message in messages:
            if "id" not in message:
                continue
            can_id = int(message["id"], 16)
            description = message["desc"]
            location = f"{path.name}: {description}"
            extended = message.get("is_ext", False)
            reservation = RESERVED_IDS.get((extended, can_id))
            if reservation:
                ecu, boot_entry = reservation
                allowed = (
                    boot_entry
                    and path.name == "ajax.json"
                    and description == f"{ecu} Boot Request"
                )
                if not allowed:
                    frame = "Extended" if extended else "Standard"
                    errors.append(
                        f"{location}: {frame} CAN ID 0x{can_id:03X} is reserved for {ecu} bootloader traffic."
                    )
    return errors


def main():
    directory = Path(__file__).resolve().parents[1] / "can-messages"
    errors = validate(directory)
    if errors:
        print("Reserved CAN ID check failed:\n" + "\n".join(errors), file=sys.stderr)
    else:
        print("No conflicts found with reserved CAN IDs.")
    return bool(errors)


if __name__ == "__main__":
    sys.exit(main())
