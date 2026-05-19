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
load_dotenv()

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
    top_n = data.get('limit', 3)
    results = predictor.predict(user_input, top_n=top_n)
    return jsonify(results)

@app.route('/disease-details', methods=['GET'])
def disease_details():
    disease_name = request.args.get('name')
    if not disease_name:
        return jsonify({"error": "Please provide a disease 'name'"}), 400
    details = predictor.get_disease_details(disease_name)
    return jsonify(details)

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
    
<<<<<<< HEAD
    # If we found data locally and aren't searching for a specific variation, return local data
    if data and not variation_term:
        return jsonify(data)

    print(f"DEBUG: Fetching Specialized NCBI data for: {search_term}")

    def fetch_clinvar_tables(term, retmax=10):
        try:
            # Step 1: ESearch
            params = {"db": "clinvar", "term": term, "retmode": "json", "retmax": retmax}
            if NCBI_API_KEY: params["api_key"] = NCBI_API_KEY
            
            search_res = requests.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", params=params, timeout=10).json()
            id_list = search_res.get('esearchresult', {}).get('idlist', [])
            
            if not id_list:
                return {"genes": [], "variants": [], "conditions": []}

            # Step 2: ESummary
            summary_params = {"db": "clinvar", "id": ",".join(id_list), "retmode": "json"}
            if NCBI_API_KEY: summary_params["api_key"] = NCBI_API_KEY
            
            summary_res = requests.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi", params=summary_params, timeout=10).json()
            result_data = summary_res.get('result', {})
            uids = result_data.get('uids', [])
            
            genes_table = []
            variants_table = []
            conditions_table = []
            
            seen_genes = set()
            seen_conditions = set()

            for uid in uids:
                item = result_data.get(uid, {})
                
                # Extract Genes
                for g in item.get('genes', []):
                    symbol = g.get('symbol')
                    if symbol and symbol not in seen_genes:
                        seen_genes.add(symbol)
                        genes_table.append({
                            "gene": symbol, # Map symbol to gene for frontend compatibility
                            "symbol": symbol,
                            "omim": g.get('omim_id', 'N/A')
                        })

                # Extract Variation Info
                variants_table.append({
                    "variation": item.get('title', 'N/A'), # Map title to variation
                    "title": item.get('title', 'N/A'),
                    "location": item.get('variation_loc', 'N/A'),
                    "protein_change": 'N/A',
                    "consequence": 'N/A',
                    "review_status": item.get('clinical_significance', {}).get('description', 'N/A'),
                    "significance": item.get('clinical_significance', {}).get('description', 'N/A')
                })

                # Extract Conditions
                germline = item.get('germline_classification', {})
                for trait in item.get('trait_refs', []):
                    trait_name = trait.get('trait_name')
                    if trait_name and trait_name not in seen_conditions:
                        seen_conditions.add(trait_name)
                        conditions_table.append({
                            "condition": trait_name, # Map name to condition
                            "name": trait_name,
                            "classification": germline.get('description', 'N/A'),
                            "pathogenicity": germline.get('description', 'N/A'),
                            "review_status": 'N/A',
                            "last_evaluated": 'N/A'
                        })

            return {
                "genes": genes_table[:10],
                "variants": variants_table[:10],
                "conditions": conditions_table[:10]
            }
        except Exception as e:
            print(f"DEBUG: Specialized Fetch Error: {e}")
            return {"genes": [], "variants": [], "conditions": []}
    data = fetch_clinvar_tables(search_term)
    return jsonify(data)
=======
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
>>>>>>> 5f347fe08a64418dac5d89e36d8c3ea509dc9c2a

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    if not data or 'message' not in data:
        return jsonify({"error": "Message is required"}), 400

    user_message = data['message']
    disease_context = data.get('context', 'General medical query')
    
    print(f"DEBUG: Chat request received: '{user_message[:50]}...'")
    
    if client:
        try:
            print("DEBUG: Attempting Groq API (llama3-8b-8192)...")
            response = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Context: {disease_context}\n\nQuestion: {user_message}"}
                ]
            )
            ai_response = response.choices[0].message.content
            print(f"DEBUG: Groq Success. Response length: {len(ai_response)}")
            return jsonify({"response": ai_response})
        except Exception as e:
            print(f"ERROR: Groq API call failed: {str(e)}")
            return jsonify({"response": "AI service temporarily unavailable"}), 503

    return jsonify({
        "response": "AI Assistant is currently unavailable. Please check the backend logs for details.",
        "error": "Groq client not initialized"
    }), 503

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
