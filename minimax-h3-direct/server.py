# -*- coding: utf-8 -*-
"""MiniMax H3 Prompt Lab — direct GGUF via llama.cpp, no Ollama."""
import base64
import json
import os
import random
import re
import socket
import string
import subprocess
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
GENERATED_DIR = os.path.join(BASE_DIR, "generated")
SAVED_PATH = os.path.join(BASE_DIR, "saved_prompts.json")
PORT, LLAMA_PORT = 8767, 8768
LLAMA_URL = f"http://127.0.0.1:{LLAMA_PORT}"
MODEL_DIRS = (r"C:\Users\sklya\Downloads\Models", r"C:\Users\sklya\.lmstudio\models")
DEFAULT_MODEL = r"C:\Users\sklya\Downloads\Models\Darkidol-Ballad-4B.i1-Q6_K.gguf"
DEFAULT_VISION_MODEL = r"C:\Users\sklya\Downloads\Models\llama-joycaption-alpha-two-hf-llava-q6_k.gguf"
LLAMA_EXE = os.path.join(os.environ.get("APPDATA", ""), "LlamaServerLauncherAvalonia", "llama.cpp", "llama-server.exe")
if not os.path.isfile(LLAMA_EXE):
    LLAMA_EXE = os.path.join(os.environ.get("APPDATA", ""), "LlamaServerLauncherAvalonia", "llama.cpp", "llama-server")
MAX_IMAGE_BYTES = 6 * 1024 * 1024
_lock, _engine_lock = threading.Lock(), threading.Lock()
_engine_process, _engine_model = None, DEFAULT_MODEL
os.makedirs(GENERATED_DIR, exist_ok=True)

SYSTEM_PROMPT = """You are a senior audiovisual director and exacting prompt writer for MiniMax H3. Transform the Russian user idea into a production-ready MiniMax H3 prompt. You do not generate video.

OUTPUT: Return ONLY the official H3 fields in this exact order, each exactly once, no Markdown, no title, no commentary:
integrated_multimodal_description: ...
overall_soundscape: ...
non_diegetic_music: ...

DETAIL IS MANDATORY. The integrated_multimodal_description must be a dense, concrete audiovisual timeline, not a short summary. Preserve every explicit subject, action, setting, period, style, color, prop, camera instruction, exclusion, dialogue, and outcome supplied by the user. Expand only with compatible production detail; never replace or silently drop a user constraint.

For [Shot 1], explicitly establish: visual medium/style; shot size and composition; every important subject with physical attributes, wardrobe and position; setting and significant props; lighting direction, color palette, surface texture and atmosphere; starting state; then action. Every later shot begins exactly `[Shot N] At MM:SS.mmm,` with strictly increasing timestamps inside the target duration. For every shot describe the visible cause→action→observable end state, continuity of identity/clothing/props, one natural camera movement, and synchronized event sounds. Camera language must be written in a sentence: motion type plus meaningful amplitude/speed, e.g. `The camera pushes in with small amplitude at slow speed`. For Static Shot say `the frame never moves` and prevent reframing.

Timing: for 5–15 seconds use only actions that fit the runtime. For 20–30 seconds use an observable beat every 3–5 seconds; distribute timestamps across the entire duration, put the most important beat around the middle, and begin the last shot at least 5 seconds before the end. Never leave a generic ending.

Dialogue: Never invent speech. User dialogue in Russian quotation marks must be copied verbatim as `The [clear speaker identity and voice] (S1) says: <d>[Russian] exact words</d>.` Then state that their lips close and speaking motion ceases. On-screen text must be in English double quotes; do not introduce it unless requested. Exclusions are plain English sentences, never a negative-prompt list.

overall_soundscape is 1–4 precise sentences about continuous ambience, physical sounds, and non-verbal sounds across the whole clip. Do not repeat dialogue or audience-only score. non_diegetic_music is 1–3 precise sentences about audience-only instrumentation, tempo, rhythm and dynamic changes, or N/A.

If an image is provided, it is <Picture 1>, the literal first frame. Preserve its actual identity, wardrobe, color, composition, setting, objects and spatial relations. Start output with exactly: `For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.` followed by a blank line and the three fields.

The brief is English except user-provided Russian dialogue. Use 350–650 English words for 5–15 sec, and 650–1100 words for 20–30 sec, unless the user's idea is inherently simpler. Never wrap H3 tags or fields in quotation marks."""

def http_json(url, method="GET", body=None, timeout=30):
    payload = json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else None
    request = urllib.request.Request(url, data=payload, method=method, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))

def label(path): return os.path.splitext(os.path.basename(path))[0]
def projector_for(model_path):
    folder, stem = os.path.dirname(model_path), os.path.splitext(os.path.basename(model_path))[0].lower()
    try: candidates = [x for x in os.listdir(folder) if x.lower().endswith('.gguf') and any(t in x.lower() for t in ('mmproj','vision','projector','clip'))]
    except OSError: return ""
    tokens = [t for t in re.split(r'[-_.]+', stem) if len(t) >= 4]
    for candidate in candidates:
        if len([t for t in tokens if t in candidate.lower()]) >= 2: return os.path.join(folder, candidate)
    return ""
def discover_models():
    result=[]
    for parent in MODEL_DIRS:
        if not os.path.isdir(parent): continue
        for root, _, names in os.walk(parent):
            for name in names:
                low=name.lower()
                if not low.endswith('.gguf') or any(t in low for t in ('mmproj','vision','projector','clip')): continue
                path=os.path.join(root,name)
                result.append({'path':path,'label':label(path),'size_gb':round(os.path.getsize(path)/1024**3,1),'vision':bool(projector_for(path))})
    return sorted(result,key=lambda x:(x['path'] != DEFAULT_MODEL,x['label'].lower()))
def valid_gguf_path(path):
    return bool(path) and path.lower().endswith('.gguf') and os.path.isfile(path)
def llama_status():
    try:
        models=http_json(LLAMA_URL+'/v1/models',timeout=3).get('data',[])
        return {'ok':bool(models),'model':models[0].get('id','') if models else ''}
    except Exception as exc: return {'ok':False,'model':'','error':str(exc)}
def stop_listener():
    try: output=subprocess.check_output(['netstat','-ano'],text=True,encoding='utf-8',errors='ignore')
    except Exception: return
    pids={line.split()[-1] for line in output.splitlines() if f':{LLAMA_PORT}' in line and 'LISTENING' in line.upper() and line.split()[-1].isdigit()}
    for pid in pids: subprocess.run(['taskkill','/PID',pid,'/T','/F'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    time.sleep(1)
def start_engine(path, ctx_size=16384):
    global _engine_process,_engine_model
    if not os.path.isfile(path): raise ValueError('GGUF-файл не найден.')
    with _engine_lock:
        state=llama_status()
        if state['ok'] and os.path.normcase(state['model'])==os.path.normcase(path): _engine_model=path; return False
        stop_listener()
        command=[LLAMA_EXE,'--model',path,'--port',str(LLAMA_PORT),'--ctx-size',str(ctx_size),'--gpu-layers','auto','--flash-attn','on','--parallel','1','--reasoning','off']
        mmproj=projector_for(path)
        if mmproj: command += ['--mmproj',mmproj]
        _engine_process=subprocess.Popen(command,cwd=BASE_DIR,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=getattr(subprocess,'CREATE_NEW_PROCESS_GROUP',0))
        _engine_model=path
        deadline=time.monotonic()+180
        while time.monotonic()<deadline:
            state=llama_status()
            if state['ok'] and os.path.normcase(state['model'])==os.path.normcase(path): return True
            time.sleep(1)
        raise RuntimeError('Модель не загрузилась за 3 минуты.')
def parse_image(data):
    if not data: return None
    match=re.fullmatch(r'data:(image/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)',data)
    if not match: raise ValueError('Поддерживаются PNG, JPG/JPEG и WebP.')
    if len(base64.b64decode(match.group(2),validate=False))>MAX_IMAGE_BYTES: raise ValueError('Фото больше 6 МБ.')
    return data
def describe_image(image, vision_model):
    """Use a vision GGUF only to produce faithful source facts for the writer."""
    start_engine(vision_model, ctx_size=8192)
    instruction = ('Analyze this image for a video director. Return ONE factual English paragraph only: '
      'visible subjects, apparent age, hair, clothing, pose, placement, props, setting, composition, lighting direction, colors, textures, camera angle, and readable text. '
      'Do not invent story, movement, sound, emotion, or hidden details.')
    response=http_json(LLAMA_URL+'/v1/chat/completions',method='POST',body={'model':vision_model,'messages':[{'role':'user','content':[{'type':'text','text':instruction},{'type':'image_url','image_url':{'url':image}}]}],'temperature':0.1,'top_p':0.8,'max_tokens':900,'stream':False},timeout=900)
    answer=(response.get('choices') or [{}])[0].get('message',{}).get('content','')
    if not answer: raise RuntimeError('Vision-модель не вернула описание фото.')
    return re.sub(r'\s+',' ',str(answer)).strip()
def generate_raw(idea,ratio,duration,model,image_description,index,count):
    detail = 'Minimum integrated_multimodal_description length: 650 English words.' if duration>=20 else 'Minimum integrated_multimodal_description length: 350 English words.'
    request=(f'Create a deeply detailed MiniMax H3 brief. Ratio: {ratio}. Duration: {duration} seconds. {detail}\n'
      f'Variant {index} of {count}: make camera language, blocking, sensory details, shot progression and score materially distinct from other variants without violating any user constraint.\n'
      f'User idea in Russian:\n{idea}\n\n'
      + (f'IMAGE FACTS FROM A SEPARATE VISION MODEL:\n{image_description}\n\nUse these as the immutable first-frame source of truth. Preserve the facts, but do not mention the vision model.\n\n' if image_description else '')
      + 'Return the three H3 fields only.')
    response=http_json(LLAMA_URL+'/v1/chat/completions',method='POST',body={'model':model,'messages':[{'role':'system','content':SYSTEM_PROMPT},{'role':'user','content':request}],'temperature':0.65+index*.1,'top_p':0.92,'max_tokens':5000 if duration>=20 else 3800,'stream':False},timeout=1500)
    answer=(response.get('choices') or [{}])[0].get('message',{}).get('content','')
    if not answer: raise RuntimeError('Модель-автор не вернула бриф.')
    return str(answer)
def normalize(text,image=False):
    clean=re.sub(r'\*{1,3}\s*','',text.replace('```text','').replace('```','')).strip()
    alignment=''
    expected='For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.'
    if image:
        alignment=expected
        if clean.startswith(expected): clean=clean[len(expected):].strip()
    else:
        clean=clean.replace(expected,'').strip()
    markers=['integrated_multimodal_description:','overall_soundscape:','non_diegetic_music:']; low=clean.lower(); pos=[low.find(x) for x in markers]
    values=[]
    for i,marker in enumerate(markers):
        if pos[i]<0: values.append(''); continue
        tails=[x for x in pos[i+1:] if x>pos[i]]; values.append(clean[pos[i]+len(marker):min(tails) if tails else len(clean)].strip())
    description=values[0] or clean; sound=values[1] or 'N/A'; music=values[2] or 'N/A'
    description=re.sub(r'<d>\s*([^<]+?)\s*</d>',lambda m:'<d>[Russian] '+m.group(1).strip()+'</d>',description)
    description=re.sub(r'\s+',' ',description).strip(); description=re.sub(r'^(?:\[Shot 1\]\s*){2,}','[Shot 1] ',description)
    if not description.startswith('[Shot 1]'): description='[Shot 1] '+description
    sound=re.sub(r'\s+',' ',sound).strip()
    music=re.sub(r'\s+',' ',music).strip()
    result=f'integrated_multimodal_description: {description}\n\noverall_soundscape: {sound}\n\nnon_diegetic_music: {music}'
    return (alignment+'\n\n' if alignment else '')+result
def saved():
    try:
        with open(SAVED_PATH,encoding='utf-8') as f:return json.load(f)
    except Exception:return []
def archive(record):
    with _lock:
        items=saved(); items.insert(0,record)
        with open(SAVED_PATH,'w',encoding='utf-8') as f:json.dump(items,f,ensure_ascii=False,indent=2)
    name=time.strftime('%Y%m%d_%H%M%S')+'_minimax-h3.txt'
    with open(os.path.join(GENERATED_DIR,name),'w',encoding='utf-8') as f:f.write(record['prompt'])
    return name

class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args): pass
    def send_json(self,code,data):
        payload=json.dumps(data,ensure_ascii=False).encode('utf-8')
        try:
            self.send_response(code); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(payload))); self.end_headers(); self.wfile.write(payload)
        except (BrokenPipeError,ConnectionAbortedError,ConnectionResetError,socket.error): pass
    def read_body(self):
        return json.loads(self.rfile.read(int(self.headers.get('Content-Length','0'))).decode('utf-8'))
    def do_GET(self):
        path=self.path.split('?',1)[0]
        static={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css'}
        if path in static:
            try:
                with open(os.path.join(STATIC_DIR,static[path]),'rb') as f:data=f.read()
                mime='text/html; charset=utf-8' if path in ('/','/index.html') else ('application/javascript; charset=utf-8' if path=='/app.js' else 'text/css; charset=utf-8')
                self.send_response(200); self.send_header('Content-Type',mime); self.send_header('Content-Length',str(len(data))); self.end_headers(); self.wfile.write(data)
            except (BrokenPipeError,ConnectionAbortedError,ConnectionResetError): pass
            return
        if path=='/api/status':
            data=llama_status(); data.update({'models':discover_models(),'active_model':_engine_model,'default_writer_model':DEFAULT_MODEL,'default_vision_model':DEFAULT_VISION_MODEL}); return self.send_json(200,data)
        if path=='/api/saved': return self.send_json(200,saved())
        self.send_json(404,{'error':'not found'})
    def do_POST(self):
        try: body=self.read_body()
        except Exception:return self.send_json(400,{'error':'Некорректный JSON.'})
        if self.path=='/api/activate-model':
            path=str(body.get('model_path',''))
            if not valid_gguf_path(path): return self.send_json(400,{'error':'Укажите существующий путь к файлу .gguf.'})
            try:return self.send_json(200,{'ok':True,'restarted':start_engine(path)})
            except Exception as exc:return self.send_json(500,{'error':str(exc)})
        if self.path=='/api/generate':
            idea=str(body.get('idea','')).strip(); ratio=str(body.get('ratio','16:9')); model=str(body.get('model_path',DEFAULT_MODEL)); vision_model=str(body.get('vision_model_path',DEFAULT_VISION_MODEL))
            try: duration=int(body.get('duration',10)); count=max(1,min(3,int(body.get('variants',3))))
            except Exception: return self.send_json(400,{'error':'Некорректная длительность или число вариантов.'})
            if not idea:return self.send_json(400,{'error':'Опишите идею.'})
            if not 5<=duration<=30:return self.send_json(400,{'error':'Длительность: 5–30 секунд.'})
            if not valid_gguf_path(model):return self.send_json(400,{'error':'Укажите существующий путь к файлу .gguf.'})
            try:image=parse_image(body.get('image_data',''))
            except ValueError as exc:return self.send_json(400,{'error':str(exc)})
            if image and (not valid_gguf_path(vision_model) or not projector_for(vision_model)):return self.send_json(422,{'error':'Для фото выберите vision GGUF с совместимым mmproj.'})
            try:
                image_description=describe_image(image,vision_model) if image else ''
                start_engine(model,ctx_size=16384); base={'idea':idea,'ratio':ratio,'duration':duration,'model_label':label(model),'vision_model_label':label(vision_model) if image else '', 'has_image':bool(image)}
                variants=[{**base,'variant_number':i,'prompt':normalize(generate_raw(idea,ratio,duration,model,image_description,i,count),bool(image))} for i in range(1,count+1)]
                return self.send_json(200,{'variants':variants,'image_description':image_description})
            except Exception as exc:return self.send_json(500,{'error':f'Ошибка генерации: {exc}'})
        if self.path=='/api/save':
            record={k:body.get(k,'') for k in ('idea','prompt','ratio','duration','model_label','has_image','variant_number')}; record.update({'id':time.strftime('%Y%m%d%H%M%S')+''.join(random.choices(string.ascii_lowercase,k=4)),'created':time.strftime('%d.%m.%Y %H:%M')})
            if not record['prompt']:return self.send_json(400,{'error':'Пустой бриф.'})
            return self.send_json(200,{'ok':True,'file':archive(record)})
        if self.path=='/api/delete':
            ident=body.get('id'); items=[x for x in saved() if x.get('id')!=ident]
            with open(SAVED_PATH,'w',encoding='utf-8') as f:json.dump(items,f,ensure_ascii=False,indent=2)
            return self.send_json(200,{'ok':True})
        self.send_json(404,{'error':'not found'})
def main():
    server=ThreadingHTTPServer(('127.0.0.1',PORT),Handler); print(f'http://127.0.0.1:{PORT}'); threading.Timer(.5,lambda:webbrowser.open(f'http://127.0.0.1:{PORT}')).start(); server.serve_forever()
if __name__=='__main__':main()
