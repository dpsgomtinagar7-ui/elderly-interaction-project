# app.py
import os, json, time, threading, queue, pyaudio, google.generativeai as genai
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from websockets.sync.client import connect

# --------------------------------------------------
# Load configuration
# --------------------------------------------------
load_dotenv()
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY") or GEMINI_API_KEY
if not GEMINI_API_KEY:
    raise RuntimeError("Please set GOOGLE_API_KEY or GEMINI_API_KEY in your .env")

genai.configure(api_key=GEMINI_API_KEY)

# --------------------------------------------------
# Flask app setup
# --------------------------------------------------
app = Flask(__name__)

# --------------------------------------------------
# Gemini Chat + Summarizer
# --------------------------------------------------
def gemini_chat(prompt):
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Chat error: {e}"

def gemini_summarize(text):
    try:
        model = genai.GenerativeModel("gemini-flash-lite-latest")
        prompt = f"Summarize this text in 2–3 clear sentences:\n\n{text}"
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Summary error: {e}"

# --------------------------------------------------
# Deepgram Text-to-Speech
# --------------------------------------------------
DEFAULT_URL = "wss://api.deepgram.com/v1/speak?encoding=linear16&sample_rate=48000&model=aura-asteria-en"
RATE, CHANNELS, FORMAT = 48000, 1, pyaudio.paInt16
TIMEOUT = 0.05
audio = None
_socket = None
_queue = queue.Queue()
_exit_event = threading.Event()

def start_speaker():
    """Initialize audio playback thread."""
    global audio, _stream
    if audio is None:
        audio = pyaudio.PyAudio()
    _stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, output=True)
    _exit_event.clear()
    def playback():
        while not _exit_event.is_set():
            try:
                data = _queue.get(timeout=TIMEOUT)
                _stream.write(data)
            except queue.Empty:
                continue
    threading.Thread(target=playback, daemon=True).start()

def connect_tts():
    global _socket
    if _socket:
        return True
    try:
        _socket = connect(DEFAULT_URL, additional_headers={"Authorization": f"Token {DEEPGRAM_API_KEY}"})
        start_speaker()
        return True
    except Exception as e:
        print("TTS connect error:", e)
        return False

def speak_text(text):
    if not connect_tts():
        return "TTS connection failed."
    try:
        _socket.send(json.dumps({"type": "Clear"}))
        _socket.send(json.dumps({"type": "Speak", "text": text}))
        _socket.send(json.dumps({"type": "Flush"}))
        return "Speaking..."
    except Exception as e:
        return f"TTS error: {e}"

# --------------------------------------------------
# Flask routes
# --------------------------------------------------
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat_api():
    data = request.get_json()
    reply = gemini_chat(data.get("prompt", ""))
    return jsonify({"reply": reply})

@app.route("/summarize", methods=["POST"])
def summarize_api():
    data = request.get_json()
    summary = gemini_summarize(data.get("text", ""))
    return jsonify({"summary": summary})

@app.route("/speak", methods=["POST"])
def speak_api():
    data = request.get_json()
    msg = speak_text(data.get("text", ""))
    return jsonify({"status": msg})

# --------------------------------------------------
# Run server
# --------------------------------------------------
if __name__ == "__main__":
    print("✅ AI Interaction Hub running at http://127.0.0.1:5000")
    app.run(debug=True)
