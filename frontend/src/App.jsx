import { useState, useRef, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  Search, 
  Dna, 
  Activity, 
  Database, 
  ShieldCheck, 
  Stethoscope, 
  AlertCircle, 
  Info,
  MapPin,
  RefreshCw,
  FlaskConical,
  ChevronRight,
  FileText,
  Thermometer,
  Layers,
  Loader2,
  Download,
  Mic,
  MicOff
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import AnatomyVisualization from './AnatomyVisualization'
import DiseaseDetailsPage from './DiseaseDetailsPage'
import AIAssistant from './AIAssistant'
import PrevalenceMap from './PrevalenceMap'
import './App.css'

const DiseaseComparison = ({ results }) => {
  if (!Array.isArray(results) || results.length < 2) return null;

  return (
    <div className="info-section-box full-width" style={{ marginTop: '2rem', border: '2px solid var(--accent)' }}>
      <div className="section-box-title" style={{ background: 'var(--accent)', color: 'white', padding: '10px', borderRadius: '4px 4px 0 0' }}>
        <Layers size={20} /> Disease Comparison
      </div>
      <div className="table-responsive" style={{ padding: '0 1rem' }}>
        <table className="details-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ background: 'var(--secondary)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Feature</th>
              {results.map((r, i) => (
                <th key={i} style={{ padding: '12px', textAlign: 'left', width: `${100 / results.length}%` }}>
                  {r.disease}
                  {i === 0 && <span style={{ marginLeft: '8px', fontSize: '0.8rem', background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>Top Match</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>Confidence</td>
              {results.map((r, i) => <td key={i} style={{ padding: '12px' }}>{r.confidence_score}%</td>)}
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>Affected Organ</td>
              {results.map((r, i) => <td key={i} style={{ padding: '12px' }}>{r.affected_organ}</td>)}
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>Prevalence</td>
              {results.map((r, i) => <td key={i} style={{ padding: '12px' }}>{r.common_states}</td>)}
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>Prevention</td>
              {results.map((r, i) => <td key={i} style={{ padding: '12px', fontSize: '0.9rem' }}>{r.prevention}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

function App() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await axios.post('http://localhost:5000/predict', {
        symptoms: query
      })
      console.log('Prediction API Full Response:', response.data);
      
      if (response.data.error || response.data.message) {
         setError(response.data.error || response.data.message)
      } else {
         setResults(response.data)
      }
    } catch (err) {
      setError('Failed to connect to the prediction server. Please ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <Stethoscope size={28} />
          <span>GenoPredict</span>
        </div>
      </header>

      <main className="main-container">
        <Routes>
          <Route path="/" element={
            <Dashboard 
              query={query} 
              setQuery={setQuery} 
              handleSearch={handleSearch} 
              loading={loading} 
              error={error} 
              results={results} 
              navigate={navigate}
            />
          } />
          <Route path="/more-details/:diseaseName" element={<DiseaseDetailsPage />} />
          <Route path="/prevalence-map/:diseaseName" element={<PrevalenceMap />} />
        </Routes>
      </main>

      <footer style={{ padding: '4rem 2rem', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        &copy; 2026 Genomic AI Bioinformatics System. All data is for clinical reference and educational use.
      </footer>

      <AIAssistant currentDisease={results ? (Array.isArray(results) ? results[0] : results) : null} />
    </div>
  )
}

const parseMutationInfo = (infoStr) => {
  if (!infoStr) return {};
  const items = infoStr.split(' | ');
  const data = {};
  items.forEach(item => {
    const [key, ...val] = item.split(': ');
    if (key && val.length > 0) {
      data[key.trim()] = val.join(': ').trim();
    }
  });
  return data;
};
const RenderDiseaseCard = ({ result, isTop = false, index = 0, navigate }) => {
  const mutationData = parseMutationInfo(result.mutation_info);
  const genes = result.related_genes ? result.related_genes.split(',').map(g => g.trim()) : [];
  
  let riskColor = 'risk-low';
  let riskLabel = 'Low Risk';
  if (result.confidence_score > 70) { riskColor = 'risk-high'; riskLabel = 'High Risk'; }
  else if (result.confidence_score >= 40) { riskColor = 'risk-medium'; riskLabel = 'Medium Risk'; }

  const handleDownloadPDF = (result) => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Clinical Genomic Report", 20, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Disease / Condition:", 20, 45);
    doc.setFont("helvetica", "normal");
    doc.text(result.disease || "N/A", 20, 55);

    doc.setFont("helvetica", "bold");
    doc.text("Confidence Score:", 20, 70);
    doc.setFont("helvetica", "normal");
    doc.text(`${result.confidence_score}%`, 20, 80);

    doc.setFont("helvetica", "bold");
    doc.text("Affected Organ:", 20, 95);
    doc.setFont("helvetica", "normal");
    doc.text(result.affected_organ || "N/A", 20, 105);

    doc.setFont("helvetica", "bold");
    doc.text("Description:", 20, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const splitDesc = doc.splitTextToSize(result.description || "N/A", 170);
    doc.text(splitDesc, 20, 130);
    
    let currentY = 130 + (splitDesc.length * 6) + 10;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Causes:", 20, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const splitCauses = doc.splitTextToSize(result.causes || "N/A", 170);
    currentY += 10;
    doc.text(splitCauses, 20, currentY);

    currentY += (splitCauses.length * 6) + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Prevention:", 20, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const splitPrev = doc.splitTextToSize(result.prevention || "N/A", 170);
    currentY += 10;
    doc.text(splitPrev, 20, currentY);

    currentY += (splitPrev.length * 6) + 10;
    
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Recovery / Treatment:", 20, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const splitRec = doc.splitTextToSize(result.recovery_treatment || "N/A", 170);
    currentY += 10;
    doc.text(splitRec, 20, currentY);

    doc.save(`${(result.disease || "clinical_report").replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`);
  };

  return (
    <div key={index} className={`disease-main-card ${isTop ? 'top-result' : ''}`}>
      {isTop && <div className="top-badge">Top Match</div>}

      <div className="card-header-section">
        <h2 className="disease-name">{result.disease}</h2>
        <div className="header-meta">
          <div className="match-score-pill">
            <Activity size={18} />
            {result.confidence_score}% Confidence
          </div>
          <div className={`risk-pill ${riskColor}`}>
            {riskLabel}
          </div>
        </div>
      </div>

      <div className="info-section-box">
        <div className="section-box-title"><FileText size={18} /> Description</div>
        <p className="description-text">{result.description || 'Clinical description not available for this condition.'}</p>
      </div>

      <div className="info-grid">
        <div className="info-section-box">
          <div className="section-box-title"><Dna size={18} /> Related Genes</div>
          <div className="gene-tags">
            {genes.length > 0 ? genes.map((gene, i) => (
              <span key={i} className="gene-tag">{gene}</span>
            )) : <span className="gene-tag">N/A</span>}
          </div>
        </div>

        <div className="info-section-box">
          <div className="section-box-title"><MapPin size={18} /> Prevalence in India</div>
          <p style={{ fontWeight: '600', marginBottom: '10px' }}>{result.prevalence_in_india || 'Nationwide / General Prevalence'}</p>
          {result.common_states && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}><strong>Common States:</strong> {result.common_states}</p>
              <a 
                href={`/prevalence-map/${encodeURIComponent(result.disease)}?states=${encodeURIComponent(result.common_states)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="search-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  background: 'var(--accent)',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '5px 10px',
                  fontSize: '0.85rem',
                  borderRadius: '4px',
                  alignSelf: 'flex-start',
                  boxShadow: 'none'
                }}
              >
                <MapPin size={16} /> Show in Map
              </a>
            </div>
          )}
        </div>        <div className="info-section-box full-width">
          <div className="section-box-title"><FlaskConical size={18} /> Mutation Details</div>
          <div className="mutation-table-container">
            <table className="mutation-table">
              <thead>
                <tr>
                  <th>Variation</th>
                  <th>Protein Change</th>
                  <th>Consequence</th>
                  <th>Condition</th>
                  <th>Review Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{mutationData['Variation'] || 'N/A'}</td>
                  <td>{mutationData['Protein Change'] || 'N/A'}</td>
                  <td>{mutationData['Consequence'] || 'N/A'}</td>
                  <td>{result.disease}</td>
                  <td>{mutationData['Review Status'] || 'Verified'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="info-section-box">
          <div className="section-box-title"><ShieldCheck size={18} /> Causes & Prevention</div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Causes:</strong><br />
            <p style={{ fontSize: '0.95rem', marginTop: '5px' }}>{result.causes}</p>
          </div>
          <div>
            <strong>Prevention:</strong><br />
            <p style={{ fontSize: '0.95rem', marginTop: '5px' }}>{result.prevention}</p>
          </div>
        </div>

        <div className="info-section-box">
          <div className="section-box-title"><RefreshCw size={18} /> Recovery Suggestions</div>
          <ul className="bullet-list">
            {result.recovery_treatment ? result.recovery_treatment.split('.').filter(s => s.trim()).map((step, i) => (
              <li key={i}>{step.trim()}</li>
            )) : <li>Consult with a specialist for a personalized recovery plan.</li>}
          </ul>
        </div>

        <div className="info-section-box full-width">
          <div>
            <div className="section-box-title" style={{ margin: 0 }}>Affected Organs</div>
            <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text)' }}>{result.affected_organ}</span>
          </div>
        </div>
      </div>

      <div className="card-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button 
          onClick={() => handleDownloadPDF(result)}
          className="search-btn"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            background: 'var(--secondary)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            boxShadow: 'none'
          }}
        >
          <Download size={20} /> Download PDF
        </button>
        <button 
          onClick={() => navigate(`/more-details/${encodeURIComponent(result.disease)}?variation=${encodeURIComponent(result.variation || '')}`)}
          className="search-btn"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            background: 'var(--secondary)',
            color: 'var(--accent)',
            border: '1px solid var(--accent)',
            boxShadow: 'none'
          }}
        >
          View More Clinical Details <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

const Dashboard = ({ query, setQuery, handleSearch, loading, error, results, navigate }) => {
  const inputRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  // Maintain focus even after re-renders
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [results]); // Re-focus when results change

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition. Please try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      // Append to existing text or set as new
      setQuery(query ? `${query} ${transcript}` : transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <>
      <div className="hero">
        <h1>Genomic Disease Prediction System</h1>
        <p>Professional AI-powered diagnostic platform</p>
      </div>

      <div className="search-container">
        <form onSubmit={handleSearch}>
          <div className="search-box">
            <Search className="search-icon" size={24} color="var(--text-muted)" />
            <input 
              ref={inputRef}
              type="text" 
              className="search-input"
              placeholder="Enter symptoms or gene mutations (e.g. fatigue, HBB mutation)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button 
              type="button" 
              onClick={startListening} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '0 10px',
                marginRight: '10px',
                color: isListening ? '#ef4444' : 'var(--text-muted)',
                animation: isListening ? 'pulse 1.5s infinite' : 'none'
              }}
              title="Speak Symptoms"
            >
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <button type="submit" className="search-btn" disabled={loading} style={{ fontSize: '1.1rem' }}>
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </form>
      </div>

    {loading && (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <Loader2 className="spinner" size={48} style={{ margin: '0 auto 20px auto', color: 'var(--accent)' }} />
        <p style={{ fontWeight: '700', color: 'var(--accent)', letterSpacing: '1px' }}>PROCESSING GENOMIC BIOMARKERS...</p>
      </div>
    )}

      {error && (
        <div className="error-msg">
          <AlertCircle size={24} />
          <p style={{ marginTop: '10px' }}>{error}</p>
        </div>
      )}

      {results && (Array.isArray(results) ? results.length > 0 : Object.keys(results).length > 0) && (
        <div className="content-layout">
          <div className="results-container">
            {!Array.isArray(results) 
              ? <RenderDiseaseCard result={results} isTop={true} navigate={navigate} />
              : results.map((res, i) => <RenderDiseaseCard key={i} result={res} isTop={i === 0} index={i} navigate={navigate} />)
          }
          {Array.isArray(results) && results.length > 1 && (
            <DiseaseComparison results={results} />
          )}
        </div>

        <div className="visualization-sidebar">
           <AnatomyVisualization 
             disease={Array.isArray(results) ? results[0]?.disease : results?.disease}
             affectedOrgan={Array.isArray(results) ? results[0]?.affected_organ : results?.affected_organ} 
           />
        </div>
      </div>
    )}

    {results && (Array.isArray(results) ? results.length === 0 : Object.keys(results).length === 0) && !loading && (
      <div className="no-results">
        <Info size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
        <p>No matches found. Please try more specific symptoms or genomic data.</p>
      </div>
    )}
  </>
  );
};

export default App
