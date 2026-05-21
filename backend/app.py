from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from ml_model import DiseasePredictor
from database import DatabaseManager
import os
import re
import requests
import json
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
NCBI_API_KEY = os.getenv("NCBI_API_KEY")

print(f"DEBUG: GROQ_API_KEY present: {'Yes' if GROQ_API_KEY else 'No'}")

# Initialize Groq Client
client = None
if GROQ_API_KEY:
    try:
        client = Groq(api_key=GROQ_API_KEY)
        print("DEBUG: Groq client initialized.")
    except Exception as e:
        print(f"ERROR: Groq initialization failed: {e}")

if not GROQ_API_KEY:
    print("CRITICAL: No Groq API Key found in .env file. AI Assistant will be unavailable.")

SYSTEM_PROMPT = (
    "You are a medical assistant for a bioinformatics project. "
    "Give clear, short, and accurate explanations about diseases. "
    "Avoid complex jargon. Answer in 2–4 lines maximum."
)


def normalize_text(value):
    return str(value or '').strip()


def extract_disease_name(question):
    text = normalize_text(question).lower()
    if text.startswith("what is "):
        candidate = text[8:]
    elif text.startswith("what's "):
        candidate = text[7:]
    elif text.startswith("is "):
        for token in [" serious", " dangerous", " risky", " life-threatening", " life threatening", " common?"]:
            if token in text:
                candidate = text[3:text.index(token)]
                break
        else:
            candidate = ''
    else:
        candidate = ''
    return normalize_text(candidate).rstrip('?.').title()


def get_disease_details_if_available(name):
    if not name:
        return None
    details = predictor.get_disease_details(name)
    if isinstance(details, dict) and details.get('error'):
        return None
    return details


def parse_groq_response(response):
    if response is None:
        return None

    if isinstance(response, dict):
        if response.get('response'):
            return response.get('response')
        if response.get('output_text'):
            return response.get('output_text')
        choices = response.get('choices')
        if isinstance(choices, list) and choices:
            first = choices[0]
            if isinstance(first, dict):
                message = first.get('message') or first
                if isinstance(message, dict):
                    return message.get('content') or message.get('text')
                return message

    if hasattr(response, 'output_text'):
        return getattr(response, 'output_text')

    if hasattr(response, 'choices') and response.choices:
        choice = response.choices[0]
        if hasattr(choice, 'message'):
            message = choice.message
            if isinstance(message, dict):
                return message.get('content') or message.get('text')
            return getattr(message, 'content', None) or getattr(message, 'text', None)
        return getattr(choice, 'text', None) or getattr(choice, 'content', None)

    if hasattr(response, 'output'):
        output = getattr(response, 'output')
        if isinstance(output, list) and len(output) > 0:
            first = output[0]
            if isinstance(first, dict):
                content = first.get('content')
                if isinstance(content, list) and len(content) > 0:
                    item = content[0]
                    if isinstance(item, dict):
                        return item.get('text')
                    return item

    return None


def call_groq_chat(user_message, disease_context):
    if not client:
        raise RuntimeError('Groq client not initialized')

    prompt = normalize_text(user_message)
    if not prompt:
        raise ValueError('Empty user message')

    if hasattr(client, 'chat'):
        return client.chat.completions.create(
            model='llama3-8b-8192',
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': prompt}
            ],
            max_tokens=180,
            temperature=0.7,
            timeout=20
        )

    if hasattr(client, 'responses'):
        return client.responses.create(
            model='llama3-8b-8192',
            input=prompt,
            max_output_tokens=180,
            temperature=0.7,
            timeout=20
        )

    raise RuntimeError('Groq client does not expose chat or responses API')


def generate_local_chat_response(user_message, disease_context):
    text = normalize_text(user_message)
    lower = text.lower()
    disease_name = extract_disease_name(text)
    has_context = normalize_text(disease_context) and disease_context.lower() != 'general medical query'
    context_disease = disease_name or (normalize_text(disease_context) if has_context else None)

    if context_disease:
        details = get_disease_details_if_available(context_disease)
        if details:
            description = normalize_text(details.get('description', 'Description not available.'))
            causes = normalize_text(details.get('causes', ''))
            prevention = normalize_text(details.get('prevention', ''))
            progression = details.get('progression') or {}
            if lower.startswith('what is') or 'about' in lower:
                return f'{context_disease} is a medical condition. {description}'
            if any(k in lower for k in ['serious', 'dangerous', 'risk', 'severity', 'life-threatening']):
                severity = normalize_text(progression.get('early', '') if isinstance(progression, dict) else '') or causes or description
                return f'{context_disease} can vary in severity. {severity or "Consult a healthcare professional for an accurate assessment."}'
            if any(k in lower for k in ['symptom', 'sign', 'manifest', 'feature']):
                symptom_text = predictor.symptom_mapping.get(context_disease.lower(), '') if hasattr(predictor, 'symptom_mapping') else ''
                if symptom_text:
                    return f'Common symptoms for {context_disease} include {symptom_text}. Please consult a healthcare professional for confirmation.'
                return f'Symptoms for {context_disease} vary. Please seek medical guidance.'
            if any(k in lower for k in ['treatment', 'manage', 'care', 'recover']):
                return f'Treatment for {context_disease} depends on the condition. {prevention or description or "Consult a physician for proper guidance."}'
            return description or f'I have data on {context_disease}, but please ask a more specific question.'

    general_map = {
        'what is dna': 'DNA is the genetic material that stores instructions for life. It is made of nucleotides arranged in a double helix.',
        'what is gene': 'A gene is a segment of DNA that contains instructions for building a specific protein or function in the body.',
        'what is genome': 'The genome is the full set of genetic material in an organism, including all its genes and non-coding sequences.',
        'what is mutation': 'A mutation is a change in DNA sequence, and it can affect how genes work; some are harmless while others can cause disease.',
        'what is blood': 'Blood carries oxygen, nutrients, and immune cells through the body, supporting every organ and tissue.',
        'what is symptom': 'A symptom is a sign or sensation that indicates a person may have a medical condition.',
        'what is a disease': 'A disease is a condition that affects normal body function, often causing symptoms and requiring treatment.'
    }

    for key, value in general_map.items():
        if key in lower:
            return value

    if 'what is' in lower or 'tell me about' in lower or 'define' in lower:
        return 'I can answer medical and genomic questions. Please specify a disease or genetic term for a more detailed response.'

    return 'AI assistant is currently unavailable. Please try again.'

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)


def generate_local_chat_response(user_message, disease_context):
    user_text = str(user_message or '').strip()
    context = str(disease_context or '').strip()
    lower_text = user_text.lower()
    disease_key = context.lower().strip() if context and context.lower() != 'general medical query' else None
    disease_details = predictor.get_disease_details(disease_key) if disease_key else None

    def safe_text(field):
        return str(disease_details.get(field, '')).strip() if isinstance(disease_details, dict) else ''

    if disease_key and isinstance(disease_details, dict) and 'error' not in disease_details:
        if 'what is' in lower_text or 'what is' in lower_text or 'about' in lower_text:
            description = safe_text('description')
            if description:
                return f"{context} is a medical condition. {description}"

        if any(keyword in lower_text for keyword in ['serious', 'dangerous', 'life-threatening', 'life threatening', 'risk', 'severity']):
            severity = safe_text('progression') or safe_text('causes') or safe_text('description')
            return (
                f"{context} can vary in severity. "
                f"{severity if severity else 'Please consult a healthcare professional for an accurate assessment.'}"
            )

        if any(keyword in lower_text for keyword in ['symptom', 'sign', 'pain', 'warning', 'manifest']):
            symptoms = predictor.symptom_mapping.get(disease_key, '') if hasattr(predictor, 'symptom_mapping') else ''
            if symptoms:
                return f"Common symptoms for {context} include {symptoms}. Consult a clinician for an accurate diagnosis."

        if any(keyword in lower_text for keyword in ['treatment', 'manage', 'manage', 'care']):
            treatment = safe_text('recovery_treatment') or safe_text('doctor_recommendation') or safe_text('description')
            return f"Treatment for {context} depends on the condition and may include medical follow-up. {treatment if treatment else 'Please seek professional medical advice.'}"

        return safe_text('description') or f"I have limited data on {context}, but I can help explain common medical aspects." 

    # General fallback for non-specific queries
    if 'symptom' in lower_text or 'cause' in lower_text or 'treatment' in lower_text:
        return (
            "I can provide high-level medical guidance based on the local disease dataset here. "
            "Please specify a disease name or ask about disease symptoms, causes, treatment, or seriousness."
        )

    return "AI assistant is currently unavailable. Please try again."
# Initialize ML Model
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "final_genomic_dataset.csv")
predictor = DiseasePredictor(data_path=DATA_FILE)

if os.path.exists(DATA_FILE):
    print("Loading ML model with dataset...")
    predictor.load_and_prepare_data()
else:
    print(f"Warning: Dataset not found at {DATA_FILE}.")

# Load Local NCBI Dataset (JSON)
NCBI_DATA_PATH = os.path.join(os.path.dirname(__file__), "ncbi_data.json")
NCBI_DATASET = {}

if os.path.exists(NCBI_DATA_PATH):
    print(f"Loading local NCBI dataset from {NCBI_DATA_PATH}...")
    with open(NCBI_DATA_PATH, 'r') as f:
        NCBI_DATASET = json.load(f)
else:
    print(f"Warning: Local NCBI dataset not found at {NCBI_DATA_PATH}. Run generate_json.py first.")

def deduplicate(records, keys):
    """Remove duplicate dicts from a list based on the given key fields."""
    seen = set()
    result = []
    for r in records:
        sig = tuple(str(r.get(k, '')).strip().lower() for k in keys)
        if sig not in seen:
            seen.add(sig)
            result.append(r)
    return result

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online", 
        "message": "Bioinformatics Disease Prediction API is running",
        "model_loaded": predictor.df is not None
    })

@app.route('/predict', methods=['POST'])
def predict_disease():
    data = request.json
    if not data or 'symptoms' not in data:
        return jsonify({"error": "Please provide 'symptoms' in the request body"}), 400
    user_input = data['symptoms']
    top_n = data.get('limit', 3)
    duration = data.get('duration')
    results = predictor.predict(user_input, top_n=top_n, symptom_duration=duration)
    return jsonify(results)

@app.route('/disease-details', methods=['GET'])
def disease_details():
    disease_name = request.args.get('name')
    if not disease_name:
        return jsonify({"error": "Please provide a disease 'name'"}), 400
    details = predictor.get_disease_details(disease_name)
    return jsonify(details)

@app.route('/get-all-diseases', methods=['GET'])
def get_all_diseases():
    diseases = predictor.get_all_diseases()
    return jsonify({"diseases": diseases})

@app.route('/get-disease', methods=['GET'])
def get_disease():
    disease_name = request.args.get('name')
    if not disease_name:
        return jsonify({"error": "Please provide a disease 'name'"}), 400
    details = predictor.get_disease_by_name(disease_name)
    if details:
        return jsonify(details)
    return jsonify({"error": "Disease not found"}), 404

@app.route('/more-details', methods=['GET'])
def more_details():
    disease_name = request.args.get('disease', '').strip()
    variation_term = request.args.get('variation', '').strip()
    
    if not disease_name and not variation_term:
        return jsonify({"error": "Disease or variation name is required"}), 400

    clean_name = disease_name.replace('_', ' ').strip()
    search_term = variation_term if variation_term else clean_name

    # Try direct lookup from local dataset first
    data = NCBI_DATASET.get(clean_name)
    if not data:
        for key in NCBI_DATASET:
            if key.lower() == clean_name.lower():
                data = NCBI_DATASET[key]
                break
    
    if not data:
        return jsonify({"genes": [], "variants": [], "conditions": []})

    return jsonify({
        "genes":      deduplicate(data.get("genes",      []), ["gene", "omim"]),
        "variants":   deduplicate(data.get("variants",   []), ["variation", "protein_change", "consequence"]),
        "conditions": deduplicate(data.get("conditions", []), ["condition", "classification", "review_status"])
    })

@app.route('/disease-full', methods=['GET'])
def disease_full():
    """Returns everything needed for the Disease Browser page in one call."""
    disease_name = request.args.get('name')
    if not disease_name:
        return jsonify({"error": "Disease name is required"}), 400

    # 1. Get ML model data (description, causes, prevention, genes, doctor, progression etc.)
    ml_data = predictor.get_disease_by_name(disease_name)
    if not ml_data:
        # Fallback: try get_disease_details
        ml_data = predictor.get_disease_details(disease_name)

    # 2. Get NCBI genomic data (gene table, variants, conditions)
    clean_name = disease_name.replace('_', ' ').strip()
    ncbi_data = NCBI_DATASET.get(clean_name)
    if not ncbi_data:
        for key in NCBI_DATASET:
            if key.lower() == clean_name.lower():
                ncbi_data = NCBI_DATASET[key]
                break
    if not ncbi_data:
        ncbi_data = {"genes": [], "variants": [], "conditions": []}

    # 3. Get symptoms from predictor's symptom map
    disease_key = disease_name.lower().strip()
    symptoms_str = predictor.symptom_mapping.get(disease_key, "")
    symptoms_list = [s.strip().capitalize() for s in symptoms_str.split(" ") if len(s.strip()) > 3] if symptoms_str else []

    # Build merged response
    result = {
        "name": disease_name,
        "description":         ml_data.get("description", "Not available") if ml_data else "Not available",
        "causes":              ml_data.get("causes", "Not available") if ml_data else "Not available",
        "prevention":          ml_data.get("prevention", "Not available") if ml_data else "Not available",
        "affected_organ":      ml_data.get("affected_organ", "General / Multiple") if ml_data else "General / Multiple",
        "doctor_recommendation": ml_data.get("doctor_recommendation", "General Physician") if ml_data else "General Physician",
        "progression":         ml_data.get("progression") if ml_data else None,
        "prevalence_in_india": ml_data.get("prevalence_in_india", "Data not available") if ml_data else "Data not available",
        "common_states":       ml_data.get("common_states", "Nationwide") if ml_data else "Nationwide",
        "symptoms":            symptoms_list,
        "genes":               deduplicate(ncbi_data.get("genes", []),      ["gene", "omim"]),
        "variants":            deduplicate(ncbi_data.get("variants", []),   ["variation", "protein_change", "consequence"]),
        "conditions":          deduplicate(ncbi_data.get("conditions", []), ["condition", "classification", "review_status"]),
    }
    return jsonify(result)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    if not data or 'message' not in data:
        return jsonify({
            "response": "AI response not available. Please try again.",
            "error": "Message is required"
        }), 400

    user_message = normalize_text(data['message'])
    print(f"DEBUG: User message: '{user_message[:200]}'")

    if not user_message:
        return jsonify({
            "response": "AI response not available. Please try again.",
            "error": "Empty message"
        }), 400

    try:
        print("DEBUG: Attempting Groq API...")
        response = call_groq_chat(user_message, '')
        print("DEBUG: Raw Groq response:", response)
        ai_response = parse_groq_response(response)

        if not ai_response or not str(ai_response).strip():
            raise ValueError('No valid response returned from Groq API')

        ai_response = str(ai_response).strip()
        print(f"DEBUG: AI response: {ai_response[:300]}")
        return jsonify({"response": ai_response})
    except Exception as e:
        print(f"ERROR: Groq API call failed: {str(e)}")
        local_reply = generate_local_chat_response(user_message, '')
        print(f"DEBUG: Local fallback response: {local_reply}")
        return jsonify({"response": local_reply, "error": str(e)}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
