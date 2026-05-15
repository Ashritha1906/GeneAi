import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { ArrowLeft, Map as MapIcon, Info, AlertCircle } from 'lucide-react';
import indiaGeo from './india-states.json';
import './App.css';

const insights = {
  "thalassemia": "Thalassemia is highly prevalent in Gujarat, Maharashtra, and West Bengal due to higher carrier frequency in specific communities.",
  "sickle cell disease": "Prevalent in central Indian tribal populations (Chhattisgarh, Madhya Pradesh, Maharashtra) due to evolutionary selection against malaria.",
  "sickle_cell": "Prevalent in central Indian tribal populations (Chhattisgarh, Madhya Pradesh, Maharashtra) due to evolutionary selection against malaria.",
  "glucose-6-phosphate dehydrogenase deficiency": "High frequency in North and Western India (Punjab, Haryana) associated with historical malaria endemicity.",
  "g6pd": "High frequency in North and Western India (Punjab, Haryana) associated with historical malaria endemicity.",
  "breast cancer": "Higher incidence in urban registries (Delhi, Kerala, Punjab) linked to lifestyle transitions and genetic factors.",
  "breast_cancer": "Higher incidence in urban registries (Delhi, Kerala, Punjab) linked to lifestyle transitions and genetic factors.",
  "parkinson's disease": "Increasing prevalence in aging populations across Kerala, Tamil Nadu, and Karnataka.",
  "parkinsons": "Increasing prevalence in aging populations across Kerala, Tamil Nadu, and Karnataka.",
  "hemophilia": "Concentrated cases reported in large state registries like Maharashtra and Uttar Pradesh due to better diagnostic networks.",
  "cystic fibrosis": "Generally rare in India, but cases are predominantly identified in North India (Delhi, Punjab) due to specific CFTR mutations.",
  "cystic_fibrosis": "Generally rare in India, but cases are predominantly identified in North India (Delhi, Punjab) due to specific CFTR mutations."
};

const defaultInsight = "Prevalence rates vary widely; genetic predisposition and regional demographic structures contribute to the observed distribution.";

const PrevalenceMap = () => {
  const { diseaseName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const commonStatesStr = queryParams.get('states') || location.state?.result?.common_states || "";
  const highlightedStates = useMemo(() => {
    if (!commonStatesStr || commonStatesStr === "Nationwide" || commonStatesStr === "General / Multiple" || commonStatesStr.includes("Urban regions")) {
      return [];
    }
    return commonStatesStr.split(',').map(s => s.trim().toLowerCase());
  }, [commonStatesStr]);

  const diseaseKey = diseaseName?.toLowerCase() || "";
  const insightText = insights[diseaseKey] || defaultInsight;

  const hasData = highlightedStates.length > 0 || commonStatesStr === "Nationwide" || commonStatesStr.includes("Urban");

  // A simple mapping from some common states to their approx center coordinates for markers
  const markers = {
    "gujarat": [71.1924, 22.2587],
    "maharashtra": [75.7139, 19.7515],
    "west bengal": [87.8550, 22.9868],
    "chhattisgarh": [81.8661, 21.2787],
    "madhya pradesh": [78.6569, 22.9734],
    "punjab": [75.3412, 31.1471],
    "haryana": [76.0856, 29.0588],
    "delhi": [77.2090, 28.6139],
    "kerala": [76.2711, 10.8505],
    "tamil nadu": [78.6569, 11.1271],
    "karnataka": [75.7139, 15.3173],
    "uttar pradesh": [80.9462, 26.8467]
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <MapIcon size={28} />
          <span>GenoPredict Map Insights</span>
        </div>
        <button onClick={() => window.close()} className="search-btn" style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }}>
          Close Tab
        </button>
      </header>

      <main className="main-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button 
          onClick={() => window.close()} 
          className="search-btn" 
          style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--secondary)', color: 'var(--text)', border: '1px solid var(--border)', marginBottom: '20px' }}
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="disease-main-card" style={{ width: '100%', maxWidth: '1000px', padding: '2rem' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '5px' }}>{diseaseName} - Regional Prevalence</h1>
          
          {!hasData ? (
            <div className="error-msg" style={{ margin: '2rem auto', maxWidth: '600px' }}>
              <AlertCircle size={24} />
              <p>No specific regional prevalence data available for this condition.</p>
            </div>
          ) : (
            <>
              <div className="info-section-box" style={{ background: 'var(--primary)', border: '1px solid var(--accent)', margin: '1rem auto 2rem auto', maxWidth: '800px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                  <Info size={24} color="var(--accent)" style={{ marginTop: '5px' }} />
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', color: 'var(--accent)' }}>Clinical Insight</h3>
                    <p style={{ margin: 0, lineHeight: '1.6', fontSize: '1.05rem' }}>{insightText}</p>
                    <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>
                      Highlighted States: {highlightedStates.length > 0 ? highlightedStates.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ') : commonStatesStr}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--secondary)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--primary)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                  <div style={{ width: '16px', height: '16px', background: 'rgba(239, 68, 68, 0.7)', borderRadius: '4px' }}></div>
                  <span>High Prevalence Area</span>
                </div>

                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ scale: 1000, center: [80, 22] }}
                  style={{ width: "100%", height: "600px", maxWidth: "800px" }}
                >
                  <Geographies geography={indiaGeo}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const stateName = geo.properties.NAME_1?.toLowerCase() || geo.properties.name?.toLowerCase() || geo.properties.st_nm?.toLowerCase() || "";
                        
                        // Check if the state is highlighted
                        let isHighlighted = false;
                        if (highlightedStates.length > 0) {
                          isHighlighted = highlightedStates.some(h => stateName.includes(h) || h.includes(stateName));
                        } else if (commonStatesStr === "Nationwide") {
                          isHighlighted = true;
                        }

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={isHighlighted ? "rgba(239, 68, 68, 0.7)" : "var(--primary)"}
                            stroke="var(--border)"
                            strokeWidth={0.5}
                            style={{
                              default: { outline: "none" },
                              hover: { fill: isHighlighted ? "rgba(239, 68, 68, 0.9)" : "var(--border)", outline: "none" },
                              pressed: { outline: "none" },
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>

                  {highlightedStates.map(stateKey => {
                    const coords = markers[stateKey];
                    if (!coords) return null;
                    return (
                      <Marker key={stateKey} coordinates={coords}>
                        <circle r={6} fill="#fff" stroke="#ef4444" strokeWidth={2} />
                        <text
                          textAnchor="middle"
                          y={-15}
                          style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fill: "var(--text)", fontWeight: "bold", textShadow: "0 0 4px var(--primary)" }}
                        >
                          {stateKey.charAt(0).toUpperCase() + stateKey.slice(1)}
                        </text>
                      </Marker>
                    );
                  })}
                </ComposableMap>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PrevalenceMap;
