from jinja2 import Environment, FileSystemLoader
from pathlib import Path
import typer
import json
import os

app = typer.Typer()


@app.command()
def main(device_type: str, output_path: str, ):
    # we need to open all of the files and combine the json, then filter out depending on the node name in the topic name
    json_f = []
    for f in os.listdir(f'{os.path.dirname(os.path.abspath(__file__))}/../can-messages'):
        # ensure just files ending with json
        if not os.path.isfile(f'{os.path.dirname(os.path.abspath(__file__))}/../can-messages/{f}') or not f.endswith('.json'):
            continue
        with open(f'{os.path.dirname(os.path.abspath(__file__))}/../can-messages/{f}', 'r') as json_file:
            print('Loading ', f)
            json_f.extend(json.loads(json_file.read()))
            json_file.close()


    # now, lets filter out based on nodename
    json_filtered = []
    for msg in json_f:
        for pt in msg["fields"]:
            if not pt["name"].startswith(device_type):
                break
        else:
            json_filtered.append(msg)


    # now, lets filter based on name and c_type existing in at least one parameter
    json_filtered_2 = []
    for msg in json_filtered:
        good = False
        for pt in msg["points"]:
            if "name" in pt and "c_type" in pt:
                good=True
                break
        if good:
            json_filtered_2.append(msg)

    print(f'Found {len(json_filtered_2)} eligible messages to generate code for of {len(json_filtered)} existing messages!')

    # Jinja2 environment
    env = Environment(loader=FileSystemLoader(f'{os.path.dirname(os.path.abspath(__file__))}'))

    # decoder_src_template = env.get_template(f"{os.path.dirname(os.path.abspath(__file__))}/templates/decoders.c.j2")
    # decoder_inc_template = env.get_template(f"{os.path.dirname(os.path.abspath(__file__))}/templates/decoders.h.j2")
    encoder_src_template = env.get_template(f"templates/encoders.c.j2")
    encoder_inc_template = env.get_template(f"templates/encoders.h.j2")
    # router_template = env.get_template(f"{os.path.dirname(os.path.abspath(__file__))}/templates/router.c.j2")

    directory_path = Path("cgen")
    if not directory_path.exists():
        directory_path.mkdir()

    # output = decoder_inc_template.render(can_msgs=json_filtered_2)
    # with open(f'cgen/decoders.h', 'w') as decoders:
    #     decoders.write(output)

    # output = decoder_src_template.render(can_msgs=json_filtered_2)
    # with open(f'cgen/decoders.c', 'w') as decoders:
    #     decoders.write(output)

    output = encoder_src_template.render(can_msgs=json_filtered_2)
    with open(f'{output_path}/Src/can_messages_tx.c', 'w') as encoders:
        encoders.write(output)

    output = encoder_inc_template.render(can_msgs=json_filtered_2)
    with open(f'{output_path}/Inc/can_messages_tx.h', 'w') as encoders:
        encoders.write(output)

    #     output = router_template.render(can_msgs=json_filtered_2)
    # with open(f'cgen/router.c', 'w') as encoders:
    #     encoders.write(output)

if __name__ == "__main__":
    app()