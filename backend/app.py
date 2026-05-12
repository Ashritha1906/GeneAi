from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from ml_model import DiseasePredictor
from database import DatabaseManager
import os
import requests

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)  # Enable CORS for frontend connection

# Initialize ML Model
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "final_genomic_dataset.csv")
predictor = DiseasePredictor(data_path=DATA_FILE)

if os.path.exists(DATA_FILE):
    print("Loading ML model with dataset...")
    predictor.load_and_prepare_data()
else:
    print(f"Warning: Dataset not found at {DATA_FILE}.")

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online", 
        "message": "Bioinformatics Disease Prediction API is running",
        "model_loaded": predictor.df is not None
    })

@app.route('/ui', methods=['GET'])
def ui():
    return render_template('index.html')

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

@app.route('/gene-search', methods=['GET'])
def gene_search():
    gene_name = request.args.get('gene')
    if not gene_name:
        return jsonify({"error": "Please provide a 'gene' name"}), 400
    info = predictor.search_genes(gene_name)
    return jsonify(info)

@app.route('/admin/init-db', methods=['POST'])
def initialize_database():
    data = request.json or {}
    host = data.get('host', 'localhost')
    user = data.get('user', 'root')
    password = data.get('password', '')
    if not os.path.exists(DATA_FILE):
        return jsonify({"error": "Dataset not found."}), 404
    db = DatabaseManager(host=host, user=user, password=password)
    if not db.connect():
        return jsonify({"error": "Failed to connect to MySQL."}), 500
    db.create_tables()
    success = db.import_csv_to_db(DATA_FILE)
    db.close()
    if success:
        return jsonify({"message": "Database initialized!"})
    return jsonify({"error": "Failed to import data."}), 500


@app.route('/more-details', methods=['GET'])
def more_details():
    disease_name = request.args.get('disease')
    if not disease_name:
        return jsonify({"error": "Please provide a disease name"}), 400

    def fetch_ncbi_data(db, term, retmax=5):
        try:
            # Step 1: ESearch
            search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db={db}&term={term}&retmode=json&retmax={retmax}"
            search_res = requests.get(search_url).json()
            id_list = search_res.get('esearchresult', {}).get('idlist', [])
            
            if not id_list:
                return []

            # Step 2: ESummary
            ids = ",".join(id_list)
            summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db={db}&id={ids}&retmode=json"
            summary_res = requests.get(summary_url).json()
            
            results = []
            uids = summary_res.get('result', {}).get('uids', [])
            for uid in uids:
                item = summary_res['result'][uid]
                if db == 'gene':
                    results.append({
                        "name": item.get('name'),
                        "description": item.get('description') or item.get('summary') or "Genomic sequence information"
                    })
                elif db == 'clinvar':
                    results.append({
                        "id": uid,
                        "clinical_significance": item.get('clinical_significance', {}).get('description') or "Reviewed clinical variant"
                    })
                elif db == 'medgen':
                    results.append({
                        "name": item.get('title') or item.get('description'),
                        "description": item.get('definition') or "Clinical condition profile"
                    })
            return results
        except Exception as e:
            print(f"Error fetching from NCBI {db}: {e}")
            return []

    data = {
        "genes": fetch_ncbi_data('gene', disease_name),
        "variants": fetch_ncbi_data('clinvar', disease_name),
        "conditions": fetch_ncbi_data('medgen', disease_name)
    }

    return jsonify(data)
    
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
