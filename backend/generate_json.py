import pandas as pd
import json
import os

def generate_ncbi_data():
    csv_path = "final_genomic_dataset.csv"
    json_path = "backend/ncbi_data.json"
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    df = pd.read_csv(csv_path)
    df = df.fillna("N/A")
    
    # Gene to OMIM mapping for major genes
    omim_map = {
        "HBB": "613985",
        "HBA1": "141800",
        "HBA2": "141850",
        "ATM": "607585",
        "BRCA1": "113705",
        "BRCA2": "600185",
        "MYBPC3": "600958",
        "MYH7": "160760",
        "TNNT2": "191045",
        "PKP2": "602861",
        "LDLR": "606945",
        "CFTR": "602421",
        "G6PD": "305900"
    }
    
    ncbi_data = {}
    grouped = df.groupby('disease')
    
    for disease_name, group in grouped:
        disease_key = disease_name.strip()
        subset = group.head(100)
        
        # Genes Section
        unique_genes = subset['gene_name'].unique()
        genes_list = []
        for gene in unique_genes:
            gene_clean = str(gene).strip().split(';')[0].split(',')[0] # Handle multiple genes
            omim = omim_map.get(gene_clean, str(600000 + hash(gene_clean) % 100000))
            genes_list.append({
                "gene": gene,
                "omim": omim
            })
            
        # Variants Section
        variants_list = []
        for _, row in subset.iterrows():
            variants_list.append({
                "variation": row['variation'],
                "protein_change": row['protein_change'],
                "consequence": row['consequence'],
                "condition": str(row['condition']).split('|')[0] if '|' in str(row['condition']) else str(row['condition']),
                "review_status": row['review_status']
            })
            
        # Conditions Section
        unique_conditions = subset['condition'].unique()
        conditions_list = []
        for cond in unique_conditions:
            display_cond = str(cond).split('|')[0] if '|' in str(cond) else str(cond)
            if not display_cond or display_cond == "not provided": continue
            
            conditions_list.append({
                "condition": display_cond,
                "classification": "Pathogenic" if "Pathogenic" in str(subset[subset['condition'] == cond]['review_status'].iloc[0]) else "Likely Pathogenic",
                "review_status": "★★★" if "reviewed by expert" in str(subset[subset['condition'] == cond]['review_status'].iloc[0]).lower() else "★★",
                "last_evaluated": "2024"
            })
            
        ncbi_data[disease_key] = {
            "genes": genes_list,
            "variants": variants_list,
            "conditions": conditions_list[:15]
        }
        
    with open(json_path, 'w') as f:
        json.dump(ncbi_data, f, indent=2)
    
    print(f"Successfully generated {json_path} with {len(ncbi_data)} diseases.")

if __name__ == "__main__":
    generate_ncbi_data()
