import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Layers, 
  Dna, 
  Activity, 
  Stethoscope, 
  AlertCircle,
  Loader2,
  GitCompare
} from 'lucide-react';

const DiseaseComparison = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [diseasesData, setDiseasesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const selectedDiseases = location.state?.selectedDiseases || [];

  useEffect(() => {
    if (selectedDiseases.length !== 2) {
      setError("Please select exactly two diseases to compare.");
      setLoading(false);
      return;
    }

    const fetchComparisonData = async () => {
      setLoading(true);
      try {
        const fetchPromises = selectedDiseases.map(disease => 
          axios.get(`http://localhost:5000/disease-details?name=${encodeURIComponent(disease)}`)
        );
        
        const responses = await Promise.all(fetchPromises);
        
        // We also need to get the symptoms and organ from the main prediction logic 
        // but since we don't have a direct endpoint for full comparison data, 
        // we'll mock or derive what's missing if necessary, or use the disease-details endpoint.
        
        // Let's see what disease-details returns. 
        // Based on ml_model.py, it returns description, causes, prevention, and associated_genes.
        
        const data = responses.map((resp, index) => ({
          name: selectedDiseases[index],
          ...resp.data,
          // Extract symptoms from description or use a map
          symptoms: deriveSymptoms(selectedDiseases[index]),
          organ: deriveOrgan(selectedDiseases[index]),
          severity: "High Match" // Default for comparison
        }));

        setDiseasesData(data);
      } catch (err) {
        console.error("Error fetching comparison data:", err);
        setError("Failed to fetch disease data for comparison.");
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [selectedDiseases]);

  // Mock functions for symptoms/organ if the API doesn't provide them clearly in disease-details
  const deriveSymptoms = (disease) => {
    const symptomMap = {
      "Thalassemia": "Fatigue, pale skin, weakness, anemia, dark urine",
      "Sickle Cell Disease": "Pain crises, infections, fatigue, swelling, anemia",
      "Sickle Cell Anemia": "Pain crises, infections, fatigue, swelling, anemia",
      "Glucose-6-Phosphate Dehydrogenase Deficiency": "Jaundice, dark urine, fatigue, rapid heart rate",
      "G6PD": "Jaundice, dark urine, fatigue, rapid heart rate",
      "Breast Cancer": "Breast lump, skin dimpling, pain, nipple inversion",
      "Parkinson's Disease": "Tremors, stiffness, slow movement, balance issues",
      "Hemophilia": "Prolonged bleeding, easy bruising, joint pain",
      "Familial Hypercholesterolemia": "High cholesterol, chest pain, xanthomas",
      "Cystic Fibrosis": "Persistent cough, lung infections, salty skin, poor growth",
      "Hypertrophic Cardiomyopathy": "Shortness of breath, chest pain, fainting, palpitations",
      "Hereditary Anemia": "Chronic fatigue, pale skin, weakness, dizziness"
    };
    return symptomMap[disease] || symptomMap[disease.toLowerCase()] || "Consult clinical reports for full symptom list";
  };

  const deriveOrgan = (disease) => {
    const organMap = {
      "Thalassemia": "Blood / Bone Marrow",
      "Sickle Cell Disease": "Blood",
      "Sickle Cell Anemia": "Blood",
      "Glucose-6-Phosphate Dehydrogenase Deficiency": "Blood",
      "Breast Cancer": "Breast",
      "Parkinson's Disease": "Brain / CNS",
      "Hemophilia": "Blood",
      "Familial Hypercholesterolemia": "Heart / Arteries",
      "Cystic Fibrosis": "Lungs / Pancreas",
      "Hypertrophic Cardiomyopathy": "Heart",
      "Hereditary Anemia": "Blood"
    };
    return organMap[disease] || organMap[disease.toLowerCase()] || "Multiple Systems";
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 className="spinner" size={48} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
        <p style={{ fontWeight: '600', color: 'var(--text-muted)' }}>PREPARING COMPARISON REPORT...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container" style={{ textAlign: 'center', padding: '4rem' }}>
        <AlertCircle size={48} color="#ff4d4d" style={{ marginBottom: '1rem' }} />
        <h3>Comparison Error</h3>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="search-btn" style={{ marginTop: '2rem' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const features = [
    { label: 'Symptoms', key: 'symptoms', icon: <Stethoscope size={18} /> },
    { label: 'Genes', key: 'associated_genes', icon: <Dna size={18} /> },
    { label: 'Severity', key: 'severity', icon: <Activity size={18} /> },
    { label: 'Affected Organ', key: 'organ', icon: <Layers size={18} /> }
  ];

  return (
    <div className="details-page">
      <button 
        onClick={() => navigate(-1)} 
        className="back-btn"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: 'none', 
          border: 'none', 
          color: 'var(--accent)', 
          cursor: 'pointer',
          fontWeight: '600',
          marginBottom: '2rem',
          padding: '0'
        }}
      >
        <ArrowLeft size={20} /> Back to Results
      </button>

      <div className="details-header" style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <GitCompare size={36} /> Disease Comparison
        </h1>
        <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} /> Side-by-side Clinical Analysis
        </p>
      </div>

      <div className="info-section-box full-width" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div className="table-responsive">
          <table className="details-table ncbi-style" style={{ margin: '0', border: 'none' }}>
            <thead>
              <tr>
                <th style={{ width: '20%', background: '#f8fafc', color: 'var(--text-muted)' }}>Feature</th>
                <th style={{ width: '40%', fontSize: '1.2rem', color: '#004a99' }}>{diseasesData[0].name}</th>
                <th style={{ width: '40%', fontSize: '1.2rem', color: '#004a99' }}>{diseasesData[1].name}</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, i) => {
                const val1 = diseasesData[0][feature.key];
                const val2 = diseasesData[1][feature.key];
                const isDifferent = JSON.stringify(val1) !== JSON.stringify(val2);
                
                return (
                  <tr key={i} style={{ backgroundColor: isDifferent ? 'rgba(14, 165, 233, 0.03)' : 'transparent' }}>
                    <td style={{ fontWeight: '700', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', height: '100%' }}>
                      {feature.icon} {feature.label}
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      {feature.key === 'associated_genes' ? (
                        <div className="gene-tags">
                          {diseasesData[0][feature.key] && diseasesData[0][feature.key].length > 0 ? (
                            diseasesData[0][feature.key].map((g, idx) => (
                              <span key={idx} className="gene-tag">{g}</span>
                            ))
                          ) : (
                            <span className="gene-tag">N/A</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontWeight: feature.key === 'severity' || isDifferent ? '700' : '400' }}>
                          {diseasesData[0][feature.key]}
                        </span>
                      )}
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      {feature.key === 'associated_genes' ? (
                        <div className="gene-tags">
                          {diseasesData[1][feature.key] && diseasesData[1][feature.key].length > 0 ? (
                            diseasesData[1][feature.key].map((g, idx) => (
                              <span key={idx} className="gene-tag">{g}</span>
                            ))
                          ) : (
                            <span className="gene-tag">N/A</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontWeight: feature.key === 'severity' || isDifferent ? '700' : '400' }}>
                          {diseasesData[1][feature.key]}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td style={{ fontWeight: '700', background: '#f8fafc' }}>Clinical Summary</td>
                <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {diseasesData[0].description?.substring(0, 150)}...
                </td>
                <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {diseasesData[1].description?.substring(0, 150)}...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={() => navigate('/')} 
          className="search-btn"
          style={{ background: 'var(--accent)', padding: '1rem 3rem' }}
        >
          Start New Analysis
        </button>
      </div>
    </div>
  );
};

export default DiseaseComparison;
