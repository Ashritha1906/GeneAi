from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from ml_model import DiseasePredictor
from database import DatabaseManager
import os
import requests
import json
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
NCBI_API_KEY = os.getenv("NCBI_API_KEY")

if GROQ_API_KEY:
    masked_key = f"{GROQ_API_KEY[:4]}...{GROQ_API_KEY[-4:]}"
    print(f"DEBUG: GROQ_API_KEY loaded: {masked_key}")
else:
    print("DEBUG: GROQ_API_KEY is missing.")

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

BASE_INSTRUCTIONS = (
    "Provide the direct, correct answer to the user's question. "
    "Do NOT give lengthy or detailed explanations. Keep your answers extremely concise, short, and to the point (maximum 1-3 sentences). "
    "If discussing a potential condition, never state that the user has the disease (do not say 'You have [disease]' or 'You suffer from [disease]'). "
    "Instead, use non-alarming phrasing like 'There is a possibility of [disease] based on symptoms'. "
    "Do NOT include disclaimer phrases like 'not a confirmed diagnosis' or 'this is not a medical diagnosis'."
)

import re

def make_language_safe(text):
    if not isinstance(text, str):
        return text
    
    # List of known diseases for matching
    diseases_pattern = r"(thalassemia|sickle cell disease|sickle cell anemia|sickle_cell|glucose-6-phosphate dehydrogenase deficiency|g6pd|breast cancer|breast_cancer|parkinson's disease|parkinsons|hemophilia|familial hypercholesterolemia|fh|cystic fibrosis|cystic_fibrosis|hypertrophic cardiomyopathy|hcm|hereditary anemia|hereditary_anemia)"
    
    # 1. Replace specific alarming patterns with safe option
    text = re.sub(
        rf"(?i)\byou\s+(?:have|suffer\s+from|are\s+diagnosed\s+with)\s+{diseases_pattern}\b",
        lambda m: f"There is a possibility of {m.group(1)} based on symptoms",
        text
    )
    
    # 2. General backup for other phrases
    text = re.sub(
        r"(?i)\byou\s+(?:have|suffer\s+from|are\s+diagnosed\s+with)\s+([a-zA-Z0-9' -]+?)(?=\.|\,|\;|\!|\?|\band\b|\bbut\b|\bor\b|$)",
        lambda m: f"There is a possibility of {m.group(1)} based on symptoms" if len(m.group(1).split()) <= 4 else m.group(0),
        text
    )
    
    # 3. Completely avoid "not a confirmed diagnosis" or similar phrases
    text = re.sub(r"(?i)\b(?:this is\s+)?not a (?:confirmed|definitive|final|actual) diagnosis\b\.?", "", text)
    text = re.sub(r"(?i)\bnot a confirmed diagnosis\b\.?", "", text)
    text = re.sub(r"(?i)\bnot a definitive diagnosis\b\.?", "", text)
    
    # Clean up spacing and punctuation
    text = re.sub(r'\s*\.\s*\.', '.', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def make_language_safe_recursive(data):
    if isinstance(data, dict):
        return {k: make_language_safe_recursive(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [make_language_safe_recursive(x) for x in data]
    elif isinstance(data, str):
        return make_language_safe(data)
    return data

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

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
    print(f"Prediction request: {user_input}")
    top_n = data.get('limit', 3)
    results = predictor.predict(user_input, top_n=top_n)
    return jsonify(make_language_safe_recursive(results))

@app.route('/disease-details', methods=['GET'])
def disease_details():
    disease_name = request.args.get('name')
    if not disease_name:
        return jsonify({"error": "Please provide a disease 'name'"}), 400
    details = predictor.get_disease_details(disease_name)
    return jsonify(make_language_safe_recursive(details))

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
        return jsonify(make_language_safe_recursive(details))
    return jsonify({"error": "Disease not found"}), 404

def deduplicate(records, keys):
    """Remove duplicate dicts from a list based on the given key fields."""
    seen = set()
    result = []
    for r in records:
        # Build a hashable signature from the specified keys
        sig = tuple(str(r.get(k, '')).strip().lower() for k in keys)
        if sig not in seen:
            seen.add(sig)
            result.append(r)
    return result

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

    res = {
        "genes":      deduplicate(data.get("genes",      []), ["gene", "omim"]),
        "variants":   deduplicate(data.get("variants",   []), ["variation", "protein_change", "consequence"]),
        "conditions": deduplicate(data.get("conditions", []), ["condition", "classification", "review_status"])
    }
    return jsonify(make_language_safe_recursive(res))

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
    return jsonify(make_language_safe_recursive(result))

def generate_fallback_response(user_message, disease_context):
    msg_lower = user_message.lower()
    disease_name = disease_context if disease_context and disease_context != 'General medical query' else None
    
    if not disease_name:
        if "what is " in msg_lower:
            disease_name = msg_lower.split("what is ")[-1].strip("? .")
    
    if not disease_name:
        return "I am currently running in offline mode. Please ask a specific question about a disease."

    ml_data = predictor.get_disease_by_name(disease_name)
    if not ml_data:
        ml_data = predictor.get_disease_details(disease_name)

    if not ml_data:
        return f"I am running in offline mode and couldn't find detailed information about '{disease_name}'."

    if "what is" in msg_lower or "describe" in msg_lower or "definition" in msg_lower:
        desc = ml_data.get("description", "No description available.")
        return f"{disease_name.title()} is described as: {desc}"
    elif "serious" in msg_lower or "progression" in msg_lower or "dangerous" in msg_lower:
        prog = ml_data.get("progression", "Information about disease progression is not available.")
        if isinstance(prog, dict):
            prog_str = ", ".join(f"{k.title()}: {v}" for k, v in prog.items())
            return f"Regarding seriousness and progression: {prog_str}"
        return f"Regarding seriousness and progression: {prog}"
    elif "cause" in msg_lower or "why" in msg_lower:
        causes = ml_data.get("causes", "Causes are not specified.")
        return f"The common causes are: {causes}"
    elif "prevent" in msg_lower or "avoid" in msg_lower:
        prev = ml_data.get("prevention", "Prevention measures are not specified.")
        return f"To prevent this, you can: {prev}"
    elif "doctor" in msg_lower or "specialist" in msg_lower or "who to see" in msg_lower:
        doc = ml_data.get("doctor_recommendation", "A General Physician is recommended.")
        return f"It is recommended to see: {doc}"
    elif "symptom" in msg_lower or "sign" in msg_lower:
        symp = predictor.symptom_mapping.get(disease_name.lower().strip(), "")
        if symp:
            return f"Common symptoms include: {symp.replace(' ', ', ')}."
        return "Symptom information is not available."
    else:
        return f"I'm operating in offline fallback mode. I know about {disease_name.title()}. Try asking what it is, if it's serious, its causes, or prevention."

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    if not data or 'message' not in data:
        return jsonify({"error": "Message is required"}), 400

    user_message = data['message']
    disease_context = data.get('context', 'General medical query')
    
    print(f"Chat request: {user_message}")
    print(f"DEBUG: Chat request received: '{user_message[:50]}...'")
    
    import re
    msg_lower = user_message.lower()
    
    is_vague = bool(re.search(r'\b(this disease|the disease|this prediction|prediction|it|symptoms)\b', msg_lower))
    has_context = disease_context and disease_context != 'General medical query'
    mentions_context = has_context and disease_context.lower() in msg_lower

    if is_vague and not mentions_context and has_context:
        dynamic_system_prompt = f"You are a medical assistant. Answer based on this disease: {disease_context}. {BASE_INSTRUCTIONS}"
    else:
        dynamic_system_prompt = f"You are a helpful scientific assistant. {BASE_INSTRUCTIONS}"

    if client:
        try:
            print("DEBUG: Attempting Groq API...")
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": dynamic_system_prompt},
                    {"role": "user", "content": user_message}
                ]
            )
            ai_response = response.choices[0].message.content
            
            if not ai_response:
                ai_response = "AI response not available"
            
            print("User:", user_message)
            print("AI:", ai_response)
            
            print(f"DEBUG: Groq Success. Response length: {len(ai_response)}")
            return jsonify(make_language_safe_recursive({"response": ai_response}))
        except Exception as e:
            print("Groq Error:", e)
            print("Using local fallback response generator due to Groq error.")
            fallback_resp = generate_fallback_response(user_message, disease_context)
            return jsonify(make_language_safe_recursive({"response": fallback_resp})), 200

    print("Using local fallback response generator because Groq client is not initialized.")
    fallback_resp = generate_fallback_response(user_message, disease_context)
    return jsonify(make_language_safe_recursive({"response": fallback_resp})), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)




