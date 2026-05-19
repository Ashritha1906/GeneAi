import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class DiseasePredictor:
    def __init__(self, data_path):
        self.data_path = data_path
        self.df = None
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = None
        
        # Feature 5: Detailed Disease Description
        self.disease_info = {
            "thalassemia": {
                "description": "Thalassemia is a genetic blood disorder characterized by reduced hemoglobin production. It leads to anemia, fatigue, and weakness. The condition is caused by mutations in genes responsible for hemoglobin synthesis, especially the HBB gene. Patients may experience delayed growth, pale skin, and bone deformities. It is commonly seen in India and Mediterranean regions. Severe cases require regular blood transfusions. Iron overload is a major complication. Early diagnosis helps manage the disease effectively. Genetic counseling is recommended for families at risk. With proper treatment, patients can lead a better quality of life.",
                "causes": "Mutation in hemoglobin genes such as HBB",
                "prevention": "Genetic screening, counseling, and early diagnosis"
            },
            "sickle cell disease": {
                "description": "Sickle cell disease is a group of inherited red blood cell disorders where red blood cells become hard and sticky, looking like a C-shaped farm tool called a sickle. These misshapen cells die early, leading to a constant shortage of red blood cells. They can also get stuck in small blood vessels and block blood flow, causing severe pain and other serious problems such as infection, acute chest syndrome, and stroke. It is inherited in an autosomal recessive pattern. Frequent monitoring and treatments like hydroxyurea or blood transfusions are essential. Comprehensive care can significantly improve life expectancy and quality.",
                "causes": "A genetic mutation in the HBB gene that causes abnormal hemoglobin to form.",
                "prevention": "Preconception genetic screening, early prenatal diagnosis, and prophylactic antibiotics for newborns."
            },
            "sickle_cell": {
                "description": "Sickle cell disease is a group of inherited red blood cell disorders where red blood cells become hard and sticky, looking like a C-shaped farm tool called a sickle. These misshapen cells die early, leading to a constant shortage of red blood cells. They can also get stuck in small blood vessels and block blood flow, causing severe pain and other serious problems such as infection, acute chest syndrome, and stroke. It is inherited in an autosomal recessive pattern. Frequent monitoring and treatments like hydroxyurea or blood transfusions are essential. Comprehensive care can significantly improve life expectancy and quality.",
                "causes": "A genetic mutation in the HBB gene that causes abnormal hemoglobin to form.",
                "prevention": "Preconception genetic screening, early prenatal diagnosis, and prophylactic antibiotics for newborns."
            },
            "glucose-6-phosphate dehydrogenase deficiency": {
                "description": "Glucose-6-phosphate dehydrogenase (G6PD) deficiency is an inherited condition usually occurring in males. It is characterized by the sudden destruction of red blood cells (hemolysis) and can lead to hemolytic anemia with red blood cells breaking down faster than the body can replace them. This destruction can be triggered by infections, severe stress, certain foods (such as fava beans), and certain drugs (like antimalarials). Symptoms include paleness, jaundice, dark urine, fatigue, and a rapid heart rate. Most people with G6PD deficiency are asymptomatic until exposed to a trigger. Avoiding known triggers is the most critical management strategy.",
                "causes": "Mutations in the G6PD gene inherited in an X-linked recessive pattern.",
                "prevention": "Avoid known dietary triggers like fava beans and certain oxidative drugs. Medical consultation before starting new medications."
            },
            "g6pd": {
                "description": "Glucose-6-phosphate dehydrogenase (G6PD) deficiency is an inherited condition usually occurring in males. It is characterized by the sudden destruction of red blood cells (hemolysis) and can lead to hemolytic anemia with red blood cells breaking down faster than the body can replace them. This destruction can be triggered by infections, severe stress, certain foods (such as fava beans), and certain drugs (like antimalarials). Symptoms include paleness, jaundice, dark urine, fatigue, and a rapid heart rate. Most people with G6PD deficiency are asymptomatic until exposed to a trigger. Avoiding known triggers is the most critical management strategy.",
                "causes": "Mutations in the G6PD gene inherited in an X-linked recessive pattern.",
                "prevention": "Avoid known dietary triggers like fava beans and certain oxidative drugs. Medical consultation before starting new medications."
            },
            "breast cancer": {
                "description": "Breast cancer forms in the cells of the breasts and can occur in both men and women, though it's far more common in women. Some breast cancers are linked to inherited gene mutations, most notably BRCA1 and BRCA2, which significantly increase the risk of developing breast and ovarian cancers. Symptoms may include a lump in the breast, changes in breast size or shape, skin dimpling, and newly inverted nipples. Early detection through regular screening is crucial and greatly improves treatment outcomes. Treatment options include surgery, radiation, chemotherapy, hormone therapy, and targeted therapies based on the tumor's biological characteristics.",
                "causes": "Inherited mutations in BRCA1, BRCA2, and other susceptible genes, along with environmental factors.",
                "prevention": "Regular mammograms, clinical breast exams, maintaining a healthy weight, and genetic counseling for high-risk families."
            },
            "breast_cancer": {
                "description": "Breast cancer forms in the cells of the breasts and can occur in both men and women, though it's far more common in women. Some breast cancers are linked to inherited gene mutations, most notably BRCA1 and BRCA2, which significantly increase the risk of developing breast and ovarian cancers. Symptoms may include a lump in the breast, changes in breast size or shape, skin dimpling, and newly inverted nipples. Early detection through regular screening is crucial and greatly improves treatment outcomes. Treatment options include surgery, radiation, chemotherapy, hormone therapy, and targeted therapies based on the tumor's biological characteristics.",
                "causes": "Inherited mutations in BRCA1, BRCA2, and other susceptible genes, along with environmental factors.",
                "prevention": "Regular mammograms, clinical breast exams, maintaining a healthy weight, and genetic counseling for high-risk families."
            },
            "parkinson's disease": {
                "description": "Parkinson's disease is a progressive nervous system disorder that affects movement. It develops gradually, often starting with a barely noticeable tremor in just one hand. The disorder also commonly causes stiffness or slowing of movement. In the early stages, the face may show little or no expression, and arms may not swing during walking. While mostly idiopathic, about 10-15% of cases are linked to specific genetic mutations (like LRRK2, PARK7, PINK1). Although it cannot be cured, medications can significantly improve symptoms by increasing dopamine levels in the brain, and in some cases, surgery may be recommended.",
                "causes": "Degeneration of dopamine-producing neurons, sometimes linked to specific genetic mutations and environmental triggers.",
                "prevention": "While not entirely preventable, a healthy diet, regular aerobic exercise, and avoiding toxic environmental exposures may reduce risk."
            },
            "parkinsons": {
                "description": "Parkinson's disease is a progressive nervous system disorder that affects movement. It develops gradually, often starting with a barely noticeable tremor in just one hand. The disorder also commonly causes stiffness or slowing of movement. In the early stages, the face may show little or no expression, and arms may not swing during walking. While mostly idiopathic, about 10-15% of cases are linked to specific genetic mutations (like LRRK2, PARK7, PINK1). Although it cannot be cured, medications can significantly improve symptoms by increasing dopamine levels in the brain, and in some cases, surgery may be recommended.",
                "causes": "Degeneration of dopamine-producing neurons, sometimes linked to specific genetic mutations and environmental triggers.",
                "prevention": "While not entirely preventable, a healthy diet, regular aerobic exercise, and avoiding toxic environmental exposures may reduce risk."
            },
            "hemophilia": {
                "description": "Hemophilia is a rare, usually inherited disorder in which the blood doesn't clot normally because it lacks sufficient blood-clotting proteins (clotting factors). People with hemophilia can bleed for a longer time after an injury and may experience dangerous internal bleeding, especially in knees, ankles, and elbows. This internal bleeding can damage organs and tissues and can be life-threatening. The condition is primarily X-linked recessive, affecting mostly males. Treatment involves regular replacement of the specific clotting factor that is reduced or missing. Modern therapies and comprehensive care allow patients to lead active and healthy lives.",
                "causes": "Mutations in genes responsible for producing clotting factor VIII (Hemophilia A) or factor IX (Hemophilia B).",
                "prevention": "Genetic counseling and testing for carriers. Preventing injuries and avoiding blood-thinning medications are critical for management."
            },
            "familial hypercholesterolemia": {
                "description": "Familial hypercholesterolemia (FH) is a genetic disorder characterized by exceptionally high levels of low-density lipoprotein (LDL) cholesterol in the blood. This leads to an increased risk of early onset coronary artery disease and heart attacks, often before the age of 50. It is usually caused by mutations in the LDLR gene, which prevents the liver from efficiently removing LDL cholesterol from the bloodstream. Physical signs may include cholesterol deposits under the skin (xanthomas) or around the eyes. Lifestyle changes and statin medications are the cornerstone of treatment to lower cholesterol levels and mitigate cardiovascular risk.",
                "causes": "Mutations in the LDLR, APOB, or PCSK9 genes causing defective cholesterol clearance.",
                "prevention": "Early cholesterol screening, aggressive lipid-lowering therapies, and maintaining a strict heart-healthy diet and lifestyle."
            },
            "fh": {
                "description": "Familial hypercholesterolemia (FH) is a genetic disorder characterized by exceptionally high levels of low-density lipoprotein (LDL) cholesterol in the blood. This leads to an increased risk of early onset coronary artery disease and heart attacks, often before the age of 50. It is usually caused by mutations in the LDLR gene, which prevents the liver from efficiently removing LDL cholesterol from the bloodstream. Physical signs may include cholesterol deposits under the skin (xanthomas) or around the eyes. Lifestyle changes and statin medications are the cornerstone of treatment to lower cholesterol levels and mitigate cardiovascular risk.",
                "causes": "Mutations in the LDLR, APOB, or PCSK9 genes causing defective cholesterol clearance.",
                "prevention": "Early cholesterol screening, aggressive lipid-lowering therapies, and maintaining a strict heart-healthy diet and lifestyle."
            },
            "cystic fibrosis": {
                "description": "Cystic fibrosis is a progressive, genetic disease that causes persistent lung infections and limits the ability to breathe over time. It is caused by mutations in the CFTR gene, which leads to the production of thick, sticky mucus in various organs, most notably the lungs and pancreas. This mucus clogs the airways and traps bacteria, leading to infections, extensive lung damage, and eventual respiratory failure. In the pancreas, the mucus prevents the release of digestive enzymes. Daily care regimens, including airway clearance techniques and inhaled medications, are vital. Recent advancements in CFTR modulator therapies have significantly improved patient outcomes.",
                "causes": "Autosomal recessive mutations in the CFTR gene leading to defective chloride channel function.",
                "prevention": "Carrier screening for prospective parents and newborn screening for early intervention and treatment."
            },
            "cystic_fibrosis": {
                "description": "Cystic fibrosis is a progressive, genetic disease that causes persistent lung infections and limits the ability to breathe over time. It is caused by mutations in the CFTR gene, which leads to the production of thick, sticky mucus in various organs, most notably the lungs and pancreas. This mucus clogs the airways and traps bacteria, leading to infections, extensive lung damage, and eventual respiratory failure. In the pancreas, the mucus prevents the release of digestive enzymes. Daily care regimens, including airway clearance techniques and inhaled medications, are vital. Recent advancements in CFTR modulator therapies have significantly improved patient outcomes.",
                "causes": "Autosomal recessive mutations in the CFTR gene leading to defective chloride channel function.",
                "prevention": "Carrier screening for prospective parents and newborn screening for early intervention and treatment."
            },
            "hypertrophic cardiomyopathy": {
                "description": "Hypertrophic cardiomyopathy (HCM) is a disease in which the heart muscle becomes abnormally thick (hypertrophied), making it harder for the heart to pump blood. It is often caused by inherited genetic mutations affecting heart muscle proteins. Many people with HCM have few, if any, symptoms and can lead normal lives, but others may experience shortness of breath, chest pain, or arrhythmias. It is a leading cause of sudden cardiac arrest in young people, including athletes. Treatment depends on symptoms and risk factors, ranging from medications to surgical interventions and implantable cardioverter-defibrillators (ICDs) to prevent sudden death.",
                "causes": "Inherited mutations in genes encoding sarcomere proteins of the heart muscle.",
                "prevention": "Family screening with echocardiograms and genetic testing. Avoiding intense competitive sports if diagnosed is crucial."
            },
            "hcm": {
                "description": "Hypertrophic cardiomyopathy (HCM) is a disease in which the heart muscle becomes abnormally thick (hypertrophied), making it harder for the heart to pump blood. It is often caused by inherited genetic mutations affecting heart muscle proteins. Many people with HCM have few, if any, symptoms and can lead normal lives, but others may experience shortness of breath, chest pain, or arrhythmias. It is a leading cause of sudden cardiac arrest in young people, including athletes. Treatment depends on symptoms and risk factors, ranging from medications to surgical interventions and implantable cardioverter-defibrillators (ICDs) to prevent sudden death.",
                "causes": "Inherited mutations in genes encoding sarcomere proteins of the heart muscle.",
                "prevention": "Family screening with echocardiograms and genetic testing. Avoiding intense competitive sports if diagnosed is crucial."
            },
            "hereditary anemia": {
                "description": "Hereditary anemias comprise a group of genetic disorders characterized by a reduced number of red blood cells or decreased hemoglobin levels. This broad category includes conditions like thalassemia, sickle cell disease, and spherocytosis. These disorders result from mutations affecting red blood cell production, structure, or lifespan. Common symptoms include chronic fatigue, weakness, pale skin, and shortness of breath. The severity can vary widely from mild, asymptomatic traits to severe forms requiring life-long medical care. Treatment is tailored to the specific type of anemia but often includes blood transfusions, iron chelation, or sometimes bone marrow transplantation.",
                "causes": "Various genetic mutations affecting red blood cell membrane, enzymes, or hemoglobin structure.",
                "prevention": "Genetic counseling and carrier screening. Ongoing medical monitoring is required to manage complications like iron overload."
            },
            "hereditary_anemia": {
                "description": "Hereditary anemias comprise a group of genetic disorders characterized by a reduced number of red blood cells or decreased hemoglobin levels. This broad category includes conditions like thalassemia, sickle cell disease, and spherocytosis. These disorders result from mutations affecting red blood cell production, structure, or lifespan. Common symptoms include chronic fatigue, weakness, pale skin, and shortness of breath. The severity can vary widely from mild, asymptomatic traits to severe forms requiring life-long medical care. Treatment is tailored to the specific type of anemia but often includes blood transfusions, iron chelation, or sometimes bone marrow transplantation.",
                "causes": "Various genetic mutations affecting red blood cell membrane, enzymes, or hemoglobin structure.",
                "prevention": "Genetic counseling and carrier screening. Ongoing medical monitoring is required to manage complications like iron overload."
            }
        }
        
        # Organ Mapping
        self.organ_map = {
            "thalassemia": "Blood / Bone Marrow",
            "sickle cell disease": "Blood",
            "sickle_cell": "Blood",
            "glucose-6-phosphate dehydrogenase deficiency": "Blood",
            "g6pd": "Blood",
            "breast cancer": "Breast",
            "breast_cancer": "Breast",
            "parkinson's disease": "Brain",
            "parkinsons": "Brain",
            "hemophilia": "Blood",
            "familial hypercholesterolemia": "Heart",
            "fh": "Heart",
            "cystic fibrosis": "Lungs",
            "cystic_fibrosis": "Lungs",
            "hypertrophic cardiomyopathy": "Heart",
            "hcm": "Heart",
            "hereditary anemia": "Blood",
            "hereditary_anemia": "Blood"
        }

        # State Mapping for India
        self.state_map = {
            "thalassemia": "Gujarat, Maharashtra, West Bengal",
            "sickle cell disease": "Chhattisgarh, Madhya Pradesh, Maharashtra",
            "sickle_cell": "Chhattisgarh, Madhya Pradesh, Maharashtra",
            "glucose-6-phosphate dehydrogenase deficiency": "Punjab, Haryana",
            "g6pd": "Punjab, Haryana",
            "breast cancer": "Delhi, Kerala, Punjab",
            "breast_cancer": "Delhi, Kerala, Punjab",
            "parkinson's disease": "Kerala, Tamil Nadu, Karnataka",
            "parkinsons": "Kerala, Tamil Nadu, Karnataka",
            "hemophilia": "Maharashtra, Uttar Pradesh",
            "familial hypercholesterolemia": "Urban regions nationwide",
            "fh": "Urban regions nationwide",
            "cystic fibrosis": "North India (Delhi, Punjab)",
            "cystic_fibrosis": "North India (Delhi, Punjab)",
            "hypertrophic cardiomyopathy": "Nationwide",
            "hcm": "Nationwide",
            "hereditary anemia": "Nationwide",
            "hereditary_anemia": "Nationwide"
        }

        # Doctor Recommendation Mapping
        self.doctor_map = {
            "thalassemia": "Hematologist",
            "sickle cell disease": "Hematologist",
            "sickle cell anemia": "Hematologist",
            "sickle_cell": "Hematologist",
            "glucose-6-phosphate dehydrogenase deficiency": "Hematologist",
            "g6pd": "Hematologist",
            "breast cancer": "Oncologist",
            "breast_cancer": "Oncologist",
            "parkinson's disease": "Neurologist",
            "parkinsons": "Neurologist",
            "hemophilia": "Hematologist",
            "familial hypercholesterolemia": "Cardiologist",
            "fh": "Cardiologist",
            "cystic fibrosis": "Pulmonologist",
            "cystic_fibrosis": "Pulmonologist",
            "hypertrophic cardiomyopathy": "Cardiologist",
            "hcm": "Cardiologist",
            "hereditary anemia": "Hematologist",
            "hereditary_anemia": "Hematologist"
        }

        # Disease Progression Mapping
        self.progression_map = {
            "thalassemia": {
                "early": "Mild anemia, fatigue, weakness",
                "moderate": "Pale skin, bone deformities, delayed growth",
                "severe": "Severe anemia, organ damage, regular transfusions required"
            },
            "sickle cell disease": {
                "early": "Fatigue, periodic episodes of pain (crises)",
                "moderate": "Frequent infections, swelling in hands and feet",
                "severe": "Vision problems, acute chest syndrome, stroke risk"
            },
            "glucose-6-phosphate dehydrogenase deficiency": {
                "early": "Asymptomatic until triggered by oxidative stress",
                "moderate": "Jaundice, dark urine, rapid heart rate",
                "severe": "Acute hemolytic crisis, kidney failure risk"
            },
            "breast cancer": {
                "early": "Small lump, no symptoms, localized to breast",
                "moderate": "Lump growth, lymph node involvement, skin changes",
                "severe": "Metastasis to other organs (bones, liver, lungs)"
            },
            "parkinson's disease": {
                "early": "Mild tremors, slight change in walking or posture",
                "moderate": "Bradykinesia (slow movement), increased rigidity, balance issues",
                "severe": "Severe motor impairment, requires assistance for daily activities"
            },
            "hemophilia": {
                "early": "Easy bruising, prolonged bleeding from minor cuts",
                "moderate": "Frequent nosebleeds, bleeding into joints without clear cause",
                "severe": "Spontaneous internal bleeding, permanent joint damage"
            },
            "familial hypercholesterolemia": {
                "early": "High LDL levels, often asymptomatic in childhood",
                "moderate": "Xanthomas (fatty deposits) on tendons or around eyes",
                "severe": "Early-onset coronary artery disease, heart attack risk"
            },
            "cystic fibrosis": {
                "early": "Salty-tasting skin, persistent cough, poor weight gain",
                "moderate": "Frequent lung infections, greasy stools, breathing difficulty",
                "severe": "Respiratory failure, liver disease, malnutrition"
            },
            "hypertrophic cardiomyopathy": {
                "early": "Mild shortness of breath, often asymptomatic",
                "moderate": "Chest pain, fainting episodes (syncope), palpitations",
                "severe": "Heart failure, severe arrhythmias, risk of sudden cardiac arrest"
            },
            "hereditary anemia": {
                "early": "Lethargy, mild shortness of breath during exertion",
                "moderate": "Persistent weakness, cold hands/feet, jaundice",
                "severe": "Organ enlargement (spleen/liver), chronic heart strain"
            }
        }

        # Symptom Mapping (exposed as self so app.py can access it)
        self.symptom_mapping = {
            "thalassemia": "fatigue pale skin weakness anemia tired exhaustion dizzy breathless bone deformities dark urine",
            "sickle cell disease": "pain infections fatigue swelling anemia tired crisis vision problems delayed growth frequent infections",
            "glucose-6-phosphate dehydrogenase deficiency": "jaundice fatigue pale skin dark urine tired yellowing eyes rapid heart rate shortness of breath trigger",
            "breast cancer": "lump pain breast tissue swelling redness skin changes discharge nipple inversion",
            "parkinson's disease": "tremor stiffness slow movement balance shaking rigid muscles posture changes speech writing changes",
            "hemophilia": "bleeding joint pain bruising blood nosebleeds prolonged bleeding tight joints swelling",
            "familial hypercholesterolemia": "chest pain cholesterol xanthomas heart attack fatty deposits family history high lipids angina",
            "cystic fibrosis": "cough lung infection shortness of breath wheezing salty skin poor growth greasy stools mucus",
            "hypertrophic cardiomyopathy": "shortness of breath chest pain fainting heart murmur palpitations rapid heartbeat dizziness syncope",
            "hereditary anemia": "fatigue weakness pale skin tired lethargy shortness of breath irregular heartbeats cold hands feet"
        }

    # Feature 3: Input Enhancement
    def enhance_input(self, text):
        synonyms = {
            "poor appetite": "poor appetite loss of appetite low hunger eating problem nutrition deficiency",
            "fatigue": "fatigue tiredness weakness low energy exhaustion",
            "fever": "fever high temperature hot sweating chills",
            "pain": "pain aching soreness discomfort hurting",
            "weakness": "weakness frailty lack of strength tired",
            "pale": "pale pale skin colorless pallor",
            "breathless": "breathless shortness of breath difficulty breathing panting"
        }
        text_lower = text.lower()
        enhanced_text = text_lower
        for key, syns in synonyms.items():
            if key in text_lower:
                enhanced_text += " " + syns
        return enhanced_text

    def load_and_prepare_data(self):
        try:
            self.df = pd.read_csv(self.data_path)
            
            cols_to_combine = ['gene_name', 'condition', 'variation', 'protein_change', 'consequence', 'disease']
            for col in cols_to_combine:
                if col in self.df.columns:
                    self.df[col] = self.df[col].fillna('')
            
            # Feature 4: Improved Text Matching
            self.df['search_text'] = self.df['condition'].astype(str) + " " + \
                                     self.df['gene_name'].astype(str) + " " + \
                                     self.df['variation'].astype(str) + " " + \
                                     self.df['disease'].astype(str)
            
            def add_symptoms(disease_name):
                if pd.isna(disease_name):
                    return ""
                disease_key = str(disease_name).lower().strip()
                return self.symptom_mapping.get(disease_key, "")
                
            self.df['symptoms'] = self.df['disease'].apply(add_symptoms)
            self.df['search_text'] = self.df['search_text'] + " " + self.df['symptoms']
            
            # Fit TF-IDF
            self.tfidf_matrix = self.vectorizer.fit_transform(self.df['search_text'])
            print(f"Model loaded with {len(self.df)} records.")
            return True
        except Exception as e:
            print(f"Error loading data: {e}")
            return False

    def predict(self, user_input, top_n=5):
        if self.df is None or self.tfidf_matrix is None:
            return {"error": "Model not loaded"}

        clean_input = user_input.strip().lower()
        
        # Exact match logic (gene/variation)
        exact_matches = self.df[self.df['gene_name'].astype(str).str.lower() == clean_input]
        if exact_matches.empty:
            exact_matches = self.df[self.df['variation'].astype(str).str.lower() == clean_input]

        if not exact_matches.empty:
            results = []
            seen_diseases = set()
            for _, row in exact_matches.iterrows():
                disease_name = row.get('disease', 'Unknown')
                if disease_name.lower() not in seen_diseases:
                    seen_diseases.add(disease_name.lower())
                    disease_key = disease_name.lower().strip()
                    disease_details = self.disease_info.get(disease_key, {})
                    
                    match = {
                        "disease": disease_name,
                        "confidence_score": 100.0,
                        "description": disease_details.get("description", "Description not available."),
                        "causes": disease_details.get("causes", "Information not available"),
                        "prevention": disease_details.get("prevention", "Information not available"),
                        "related_genes": str(row.get('gene_name', '')).replace(';', ','),
                        "mutation_info": f"Variation: {row.get('variation', 'N/A')} | Protein Change: {row.get('protein_change', 'N/A')} | Consequence: {row.get('consequence', 'N/A')} | Condition: {row.get('condition', 'N/A')} | Review Status: {row.get('review_status', 'N/A')}",
                        "prevalence_in_india": row.get('region', 'Data not available'),
                        "common_states": self.state_map.get(disease_key, "General / Multiple"),
                        "recovery_treatment": row.get('recovery', 'Consult a healthcare professional'),
                        "affected_organ": self.organ_map.get(disease_key, "General / Multiple"),
                        "variation": str(row.get('variation', '')),
                        "doctor_recommendation": self.doctor_map.get(disease_key, 'General Physician'),
                        "progression": self.progression_map.get(disease_key, None)
                    }
                    results.append(match)
                    if len(results) >= 1:
                        break # Only return 1 for exact match
            return results[0] if len(results) == 1 else results

        # Feature 6: Updated ML Logic
        enhanced_input = self.enhance_input(user_input)
        user_vector = self.vectorizer.transform([enhanced_input])
        similarities = cosine_similarity(user_vector, self.tfidf_matrix).flatten()
        
        top_indices = similarities.argsort()[::-1]
        
        highest_score = similarities[top_indices[0]] if len(top_indices) > 0 else 0
        
        # Feature 1: Smart Disease Selection
        is_strong_match = highest_score > 0.60
        threshold = 0.10 if not is_strong_match else 0.60
        max_results = 1 if is_strong_match else top_n
        
        results = []
        seen_diseases = set()
        
        for idx in top_indices:
            score = similarities[idx]
            if score < threshold:
                break
                
            row = self.df.iloc[idx]
            disease_name = row.get('disease', 'Unknown')
            
            if disease_name.lower() not in seen_diseases:
                seen_diseases.add(disease_name.lower())
                
                disease_key = disease_name.lower().strip()
                disease_details = self.disease_info.get(disease_key, {})
                
                # Feature 2: Confidence Scoring
                confidence = round(score * 100, 2)
                
                match = {
                    "disease": disease_name,
                    "confidence_score": confidence,
                    "description": disease_details.get("description", "Description not available."),
                    "causes": disease_details.get("causes", "Information not available"),
                    "prevention": disease_details.get("prevention", "Information not available"),
                    "related_genes": str(row.get('gene_name', '')).replace(';', ','),
                    "mutation_info": f"Variation: {row.get('variation', 'N/A')} | Protein Change: {row.get('protein_change', 'N/A')} | Consequence: {row.get('consequence', 'N/A')} | Condition: {row.get('condition', 'N/A')} | Review Status: {row.get('review_status', 'N/A')}",
                    "prevalence_in_india": row.get('region', 'Data not available'),
                    "common_states": self.state_map.get(disease_key, "General / Multiple"),
                    "recovery_treatment": row.get('recovery', 'Consult a healthcare professional'),
                    "affected_organ": self.organ_map.get(disease_key, "General / Multiple"),
                    "variation": str(row.get('variation', '')),
                    "doctor_recommendation": self.doctor_map.get(disease_key, 'General Physician'),
                    "progression": self.progression_map.get(disease_key, None)
                }
                results.append(match)
                
                if len(results) >= max_results:
                    break
                    
        if not results:
            return {"message": "No strong matches found. Please try providing more specific symptoms or mutation names."}
            
        # Feature 7: Backend update
        # Return single object if 1 result (strong match)
        if len(results) == 1:
            return results[0]
            
        return results

    def get_disease_details(self, disease_name):
        # Try different casings for lookup
        details = self.disease_info.get(disease_name.lower())
        if not details:
            details = self.disease_info.get(disease_name.title())
            
        if details:
            # Create a copy to avoid mutating the original dictionary
            result = details.copy()
            disease_key = disease_name.lower().strip()
            result['affected_organ'] = self.organ_map.get(disease_key, "General / Multiple")
            result['doctor_recommendation'] = self.doctor_map.get(disease_key, "General Physician")
            result['common_states'] = self.state_map.get(disease_key, "Nationwide")
            result['progression'] = self.progression_map.get(disease_key, None)
            
            if self.df is not None:
                # Get all unique gene strings for this disease
                raw_genes = self.df[self.df['disease'].str.lower() == disease_name.lower()]['gene_name'].unique().tolist()
                
                # Split and clean individual genes
                all_genes = set()
                for g_str in raw_genes:
                    if not g_str: continue
                    # Split by common delimiters and add each part
                    parts = [p.strip() for p in str(g_str).replace(';', ',').split(',')]
                    for p in parts:
                        if p and p.upper() != 'N/A':
                            all_genes.add(p)
                
                result['associated_genes'] = sorted(list(all_genes))[:10] # Return up to 10 unique genes
            return result
        return {"error": f"Disease '{disease_name}' not found in local records"}
        
    def search_genes(self, gene_name):
        if self.df is None:
            return {"error": "Model not loaded"}
            
        matches = self.df[self.df['gene_name'].str.lower() == gene_name.lower()]
        if not matches.empty:
            diseases = matches['disease'].unique().tolist()
            variations = matches['variation'].unique()[:10].tolist()
            return {
                "gene": gene_name.upper(),
                "associated_diseases": diseases,
                "common_variations": variations
            }
        return {"error": "Gene not found"}

    def get_all_diseases(self):
        if self.df is not None:
            diseases = self.df['disease'].dropna().unique().tolist()
            return sorted(list(set([str(d).strip() for d in diseases if str(d).strip()])))
        return []

    def get_disease_by_name(self, disease_name):
        if self.df is None:
            return None
            
        clean_name = disease_name.strip().lower()
        matches = self.df[self.df['disease'].astype(str).str.lower() == clean_name]
        
        if not matches.empty:
            row = matches.iloc[0]
            # Replace underscores for disease_key matching just in case
            disease_key = clean_name.replace('_', ' ')
            if disease_key not in self.disease_info:
                 disease_key = clean_name # try original
                 
            disease_details = self.disease_info.get(disease_key, {})
            if not disease_details and clean_name in self.disease_info:
                 disease_details = self.disease_info[clean_name]
                 
            match = {
                "disease": row.get('disease', disease_name),
                "confidence_score": 100.0,
                "description": disease_details.get("description", "Description not available."),
                "causes": disease_details.get("causes", "Information not available"),
                "prevention": disease_details.get("prevention", "Information not available"),
                "related_genes": str(row.get('gene_name', '')).replace(';', ','),
                "mutation_info": f"Variation: {row.get('variation', 'N/A')} | Protein Change: {row.get('protein_change', 'N/A')} | Consequence: {row.get('consequence', 'N/A')} | Condition: {row.get('condition', 'N/A')} | Review Status: {row.get('review_status', 'N/A')}",
                "prevalence_in_india": row.get('region', 'Data not available'),
                "common_states": self.state_map.get(disease_key, "Nationwide"),
                "recovery_treatment": row.get('recovery', 'Consult a healthcare professional'),
                "affected_organ": self.organ_map.get(disease_key, "General / Multiple"),
                "doctor_recommendation": self.doctor_map.get(disease_key, 'General Physician'),
                "progression": self.progression_map.get(disease_key, None)
            }
            return match
        return None
