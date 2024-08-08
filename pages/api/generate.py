import threading
from flask import Flask, request, jsonify
import websocket
import uuid
import json
import urllib.request
import urllib.parse
import requests
import random
from PIL import Image
import io
import base64
from flask_cors import CORS
import logging
#logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    handlers=[logging.StreamHandler()])

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

server_address = "127.0.0.1:8188"
client_id = str(uuid.uuid4())

tasks = {}

# queue_prompt, get_image, get_history, get_images, upload_file
def queue_prompt(prompt):
    try:
        p = {"prompt": prompt, "client_id": client_id}
        data = json.dumps(p).encode('utf-8')
        req = urllib.request.Request(f"http://{server_address}/prompt", data=data)
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read())
    except Exception as e:
        logging.error(f"Error in queue_prompt: {str(e)}")
        raise

def get_image(filename, subfolder, folder_type):
    try:
        data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
        url_values = urllib.parse.urlencode(data)
        with urllib.request.urlopen(f"http://{server_address}/view?{url_values}") as response:
            return response.read()
    except Exception as e:
        logging.error(f"Error in get_image: {str(e)}")
        raise

def get_history(prompt_id):
    try:
        with urllib.request.urlopen(f"http://{server_address}/history/{prompt_id}") as response:
            return json.loads(response.read())
    except Exception as e:
        logging.error(f"Error in get_history: {str(e)}")
        raise

def get_images(ws, prompt):
    try:
        prompt_id = queue_prompt(prompt)['prompt_id']
        output_images = {}
        while True:
            out = ws.recv()
            if isinstance(out, str):
                message = json.loads(out)
                if message['type'] == 'executing':
                    data = message['data']
                    if data['node'] is None and data['prompt_id'] == prompt_id:
                        break  # Execution is done
            else:
                continue  # previews are binary data

        history = get_history(prompt_id)[prompt_id]
        for o in history['outputs']:
            for node_id in history['outputs']:
                node_output = history['outputs'][node_id]
                if 'images' in node_output:
                    images_output = []
                    for image in node_output['images']:
                        image_data = get_image(image['filename'], image['subfolder'], image['type'])
                        images_output.append(image_data)
                    output_images[node_id] = images_output

        return output_images
    except Exception as e:
        logging.error(f"Error in get_images: {str(e)}")
        raise


def upload_file(file_data, subfolder="", overwrite=False):
    try:
        body = {"image": ("image.png", file_data, "image/png")}
        data = {}
        
        if overwrite:
            data["overwrite"] = "true"
  
        if subfolder:
            data["subfolder"] = subfolder

        resp = requests.post(f"http://{server_address}/upload/image", files=body, data=data)
        
        if resp.status_code == 200:
            data = resp.json()
            path = data["name"]
            if "subfolder" in data and data["subfolder"] != "":
                path = f"{data['subfolder']}/{path}"
            return path
        else:
            logging.error(f"Upload failed: {resp.status_code} - {resp.reason}")
            return None
    except Exception as error:
        logging.error(f"Error in upload_file: {str(error)}")
        return None

def process_image(task_id, file_data):
    try:
        logging.info(f"Processing task {task_id}")
        logging.info("Uploading image to ComfyUI")
        comfyui_path_image = upload_file(file_data, "", True)
        if comfyui_path_image is None:
            logging.error("Failed to upload image to ComfyUI")
            tasks[task_id] = {"status": "failed", "error": "Failed to upload image to ComfyUI"}
            return

        with open("workflow_api1.json", "r", encoding="utf-8") as f:
            workflow_data = f.read()
        
        logging.info("Loading workflow")
        workflow = json.loads(workflow_data)
        workflow["41"]["inputs"]["lora_name"] = "zyd232_CyberneticJawless_v1_1.safetensors"
        workflow["1"]["inputs"]["image"] = comfyui_path_image
        
        seed = random.randint(1, 1000000000)
        
        logging.info("Connecting to WebSocket")
        ws = websocket.WebSocket()
        ws.connect(f"ws://{server_address}/ws?clientId={client_id}")
        
        try:
            logging.info("Getting images from ComfyUI")
            images = get_images(ws, workflow)
        finally:
            ws.close()
        
        logging.info("Processing generated images")
        generated_images = []
        for node_id in images:
            for image_data in images[node_id]:
                image = Image.open(io.BytesIO(image_data))
                buffered = io.BytesIO()
                image.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode()
                generated_images.append({
                    'node_id': node_id,
                    'seed': seed,
                    'image': img_str
                })
        
        tasks[task_id] = {"status": "completed", "result": {"images": generated_images}}
        logging.info(f"Task {task_id} completed with {len(generated_images)} images")
    except Exception as e:
        logging.error(f"Error in process_image: {str(e)}")
        tasks[task_id] = {"status": "failed", "error": str(e)}

@app.route('/generate', methods=['POST'])
def generate_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    file_data = file.read()  # 读取文件数据
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "processing"}
    
    threading.Thread(target=process_image, args=(task_id, file_data)).start()
    
    return jsonify({'task_id': task_id}), 202

@app.route('/progress/<task_id>', methods=['GET'])
def check_progress(task_id):
    if task_id not in tasks:
        logging.warning(f"Task {task_id} not found")
        return jsonify({'error': 'Task not found'}), 404
    
    task = tasks[task_id]
    logging.info(f"Progress check for task {task_id}: {task['status']}")
    return jsonify(task)

if __name__ == '__main__':
    app.run(debug=True)