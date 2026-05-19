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

const highlightColors = [
  "#3b82f6", // Blue
  "#10b981", // Emerald Green
  "#8b5cf6", // Purple/Violet
  "#f59e0b", // Amber/Orange
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#ef4444", // Red
  "#6366f1"  // Indigo
];

const PrevalenceMap = () => {
  const { diseaseName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const rawStates = queryParams.get('states') || location.state?.result?.common_states || "";
  const commonStatesStr = useMemo(() => {
    if (!rawStates || rawStates.trim() === "" || rawStates.toLowerCase() === "n/a" || rawStates.toLowerCase() === "none") {
      return "Nationwide";
    }
    return rawStates;
  }, [rawStates]);

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
                    
                    <div style={{ margin: '15px 0 0 0', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold' }}>Highlighted Regions:</span>
                      {highlightedStates.length > 0 ? (
                        highlightedStates.map((stateKey, idx) => {
                          const color = highlightColors[idx % highlightColors.length];
                          return (
                            <span 
                              key={stateKey} 
                              style={{ 
                                background: color, 
                                color: 'white', 
                                padding: '4px 10px', 
                                borderRadius: '20px', 
                                fontSize: '0.85rem', 
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <span style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%' }}></span>
                              {stateKey.charAt(0).toUpperCase() + stateKey.slice(1)}
                            </span>
                          );
                        })
                      ) : (
                        <span style={{ background: 'var(--accent)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700' }}>
                          {commonStatesStr}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--secondary)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--secondary)', padding: '12px 18px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', boxShadow: 'var(--shadow)', zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '4px' }}>
                    <span>Map Legend</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '14px', height: '14px', background: '#e2e8f0', borderRadius: '3px', border: '1px solid #cbd5e1' }}></div>
                    <span style={{ color: 'var(--text-muted)' }}>Low / No Prevalence</span>
                  </div>
                  {highlightedStates.length > 0 ? (
                    highlightedStates.map((stateKey, idx) => {
                      const color = highlightColors[idx % highlightColors.length];
                      return (
                        <div key={stateKey} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '14px', height: '14px', background: color, borderRadius: '3px' }}></div>
                          <span style={{ fontWeight: '500' }}>{stateKey.charAt(0).toUpperCase() + stateKey.slice(1)}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '14px', height: '14px', background: 'rgba(14, 165, 233, 0.4)', borderRadius: '3px', border: '1px solid var(--accent)' }}></div>
                      <span style={{ fontWeight: '500' }}>{commonStatesStr}</span>
                    </div>
                  )}
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
                        let stateColor = "#e2e8f0"; // Base map state color
                        
                        if (highlightedStates.length > 0) {
                          const highlightIndex = highlightedStates.findIndex(h => stateName.includes(h) || h.includes(stateName));
                          if (highlightIndex !== -1) {
                            isHighlighted = true;
                            stateColor = highlightColors[highlightIndex % highlightColors.length];
                          }
                        } else if (commonStatesStr === "Nationwide") {
                          isHighlighted = true;
                          stateColor = "rgba(14, 165, 233, 0.4)"; // Soft blue highlight for Nationwide
                        }

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={stateColor}
                            stroke="#ffffff"
                            strokeWidth={0.75}
                            style={{
                              default: { outline: "none" },
                              hover: { fill: isHighlighted ? stateColor : "#cbd5e1", outline: "none", cursor: 'pointer' },
                              pressed: { outline: "none" },
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>

                  {highlightedStates.map((stateKey, idx) => {
                    const coords = markers[stateKey];
                    if (!coords) return null;
                    const color = highlightColors[idx % highlightColors.length];
                    return (
                      <Marker key={stateKey} coordinates={coords}>
                        <circle r={6} fill="#fff" stroke={color} strokeWidth={3} />
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
