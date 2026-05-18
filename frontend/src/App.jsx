import { useState, useRef, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  Search, 
  Dna, 
  Activity, 
  ShieldCheck, 
  Stethoscope, 
  AlertCircle, 
  Info,
  MapPin,
  RefreshCw,
  FlaskConical,
  ChevronRight,
  FileText,
  Layers,
  Loader2,
<<<<<<< HEAD
  Download,
  Mic,
  MicOff
=======
  GitCompare,
  CheckCircle2,
  History as HistoryIcon,
  Trash2,
  Clock,
  X,
  UserCheck
>>>>>>> b3d9ddf (Added my feature updates)
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import AnatomyVisualization from './AnatomyVisualization'
import DiseaseDetailsPage from './DiseaseDetailsPage'
<<<<<<< HEAD
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

=======
import DiseaseComparison from './DiseaseComparison'
import DiseaseBrowser from './DiseaseBrowser'
import './App.css'

// ─── localStorage helpers ───────────────────────────────────────────────────
const HISTORY_KEY = 'geno_history';

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function saveHistory(symptoms, results) {
  const history = loadHistory();
  const entry = { id: Date.now(), symptoms, results, timestamp: new Date().toLocaleString() };
  const updated = [entry, ...history].slice(0, 10);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

// ─── App root ───────────────────────────────────────────────────────────────
>>>>>>> b3d9ddf (Added my feature updates)
function App() {
  const navigate   = useNavigate()
  const [query,   setQuery]   = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error,   setError]   = useState(null)

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    if (!query.trim()) return
    setLoading(true); setError(null); setResults(null)
    try {
      const response = await axios.post('http://localhost:5000/predict', { symptoms: query })
      if (response.data.error || response.data.message) {
        setError(response.data.error || response.data.message)
      } else {
        setResults(response.data)
        saveHistory(query, response.data)
      }
    } catch {
      setError('Failed to connect to the prediction server. Please ensure the backend is running.')
    } finally { setLoading(false) }
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <Stethoscope size={28} />
          <span>GenoPredict</span>
        </div>
        <button
          onClick={() => navigate('/browse')}
          style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.25)', color:'var(--accent)', borderRadius:'10px', padding:'8px 18px', fontWeight:'700', fontSize:'0.88rem', cursor:'pointer' }}
        >
          <Layers size={16} /> Disease Library
        </button>
      </header>

      <main className="main-container">
        <Routes>
          <Route path="/" element={
            <Dashboard
              query={query} setQuery={setQuery}
              handleSearch={handleSearch}
              loading={loading} error={error}
              results={results} setResults={setResults}
              navigate={navigate}
            />
          } />
          <Route path="/more-details/:diseaseName" element={<DiseaseDetailsPage />} />
<<<<<<< HEAD
          <Route path="/prevalence-map/:diseaseName" element={<PrevalenceMap />} />
=======
          <Route path="/compare" element={<DiseaseComparison />} />
          <Route path="/browse" element={<DiseaseBrowser />} />
>>>>>>> b3d9ddf (Added my feature updates)
        </Routes>
      </main>

      <footer style={{ padding: '4rem 2rem', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        &copy; 2026 Genomic AI Bioinformatics System. All data is for clinical reference and educational use.
      </footer>

      <AIAssistant currentDisease={results ? (Array.isArray(results) ? results[0] : results) : null} />
    </div>
  )
}

// ─── parseMutationInfo ───────────────────────────────────────────────────────
const parseMutationInfo = (infoStr) => {
  if (!infoStr) return {};
  const data = {};
  infoStr.split(' | ').forEach(item => {
    const [key, ...val] = item.split(': ');
    if (key && val.length > 0) data[key.trim()] = val.join(': ').trim();
  });
  return data;
};

// ─── RenderDiseaseCard ───────────────────────────────────────────────────────
const RenderDiseaseCard = ({ result, isTop = false, index = 0, navigate, selectedDiseases, onToggleSelection }) => {
  const isSelected   = selectedDiseases?.includes(result.disease) ?? false;
  const mutationData = parseMutationInfo(result.mutation_info);
<<<<<<< HEAD
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
=======
  const genes        = result.related_genes
    ? result.related_genes.split(',').map(g => g.trim()).filter(g => g && g.toUpperCase() !== 'N/A')
    : [];

  let riskColor = 'risk-low', riskLabel = 'Low Risk';
  if (result.confidence_score > 80)      { riskColor = 'risk-high';   riskLabel = 'High Risk'; }
  else if (result.confidence_score > 50) { riskColor = 'risk-medium'; riskLabel = 'Medium Risk'; }
>>>>>>> b3d9ddf (Added my feature updates)

  const stageColors = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className={`disease-main-card ${isTop ? 'top-result' : ''} ${isSelected ? 'selected-for-compare' : ''}`} style={{ position: 'relative' }}>
      {isTop && <div className="top-badge">Top Match</div>}

      {/* Compare selection button */}
      {onToggleSelection && (
        <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10 }}>
          <button
            onClick={() => onToggleSelection(result.disease)}
            style={{
              background:   isSelected ? 'var(--accent)' : 'rgba(14,165,233,0.07)',
              color:        isSelected ? '#fff' : 'var(--accent)',
              border:       isSelected ? 'none' : '1.5px dashed var(--accent)',
              borderRadius: '12px',
              padding:      '6px 14px',
              display:      'flex',
              alignItems:   'center',
              gap:          '7px',
              cursor:       'pointer',
              fontSize:     '0.83rem',
              fontWeight:   '700',
              transition:   'all 0.3s ease',
              boxShadow:    isSelected ? '0 8px 16px rgba(14,165,233,0.3)' : 'none',
            }}
          >
            {isSelected ? <><CheckCircle2 size={15} /> Selected</> : <><GitCompare size={15} /> Add to Compare</>}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="card-header-section">
        <h2 className="disease-name">{result.disease}</h2>
        <div className="header-meta">
          <div className="match-score-pill"><Activity size={18} />{result.confidence_score}% Confidence</div>
          <div className={`risk-pill ${riskColor}`}>{riskLabel}</div>
        </div>
      </div>

      {/* Description */}
      <div className="info-section-box">
        <div className="section-box-title"><FileText size={18} /> Description</div>
        <p className="description-text">{result.description || 'Clinical description not available.'}</p>
      </div>

      <div className="info-grid">
        {/* Related Genes */}
        <div className="info-section-box">
          <div className="section-box-title"><Dna size={18} /> Related Genes</div>
          <div className="gene-tags">
            {genes.length > 0
              ? genes.map((g, i) => <span key={i} className="gene-tag">{g}</span>)
              : <span className="gene-tag">N/A</span>}
          </div>
        </div>

        {/* Prevalence */}
        <div className="info-section-box">
          <div className="section-box-title"><MapPin size={18} /> Prevalence in India</div>
<<<<<<< HEAD
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
=======
          <p style={{ fontWeight: '600' }}>{result.prevalence_in_india || 'Nationwide / General Prevalence'}</p>
        </div>

        {/* Mutation Details */}
        <div className="info-section-box full-width">
>>>>>>> b3d9ddf (Added my feature updates)
          <div className="section-box-title"><FlaskConical size={18} /> Mutation Details</div>
          <div className="mutation-table-container">
            <table className="mutation-table">
              <thead><tr>
                <th>Variation</th><th>Protein Change</th><th>Consequence</th><th>Condition</th><th>Review Status</th>
              </tr></thead>
              <tbody><tr>
                <td>{mutationData['Variation']      || 'N/A'}</td>
                <td>{mutationData['Protein Change'] || 'N/A'}</td>
                <td>{mutationData['Consequence']    || 'N/A'}</td>
                <td>{result.disease}</td>
                <td>{mutationData['Review Status']  || 'Verified'}</td>
              </tr></tbody>
            </table>
          </div>
        </div>

        {/* Causes & Prevention */}
        <div className="info-section-box">
          <div className="section-box-title"><ShieldCheck size={18} /> Causes &amp; Prevention</div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Causes:</strong><br />
            <p style={{ fontSize: '0.95rem', marginTop: '5px' }}>{result.causes}</p>
          </div>
          <div>
            <strong>Prevention:</strong><br />
            <p style={{ fontSize: '0.95rem', marginTop: '5px' }}>{result.prevention}</p>
          </div>
        </div>

        {/* Recovery */}
        <div className="info-section-box">
          <div className="section-box-title"><RefreshCw size={18} /> Recovery Suggestions</div>
          <ul className="bullet-list">
            {result.recovery_treatment
              ? result.recovery_treatment.split('.').filter(s => s.trim()).map((step, i) => <li key={i}>{step.trim()}</li>)
              : <li>Consult with a specialist for a personalised recovery plan.</li>}
          </ul>
        </div>

        {/* Doctor Recommendation */}
        <div className="info-section-box full-width">
          <div className="section-box-title"><UserCheck size={18} /> Recommended Doctor</div>
          <p style={{ fontSize: '1.1rem', color: 'var(--accent)', fontWeight: '400', marginTop: '6px' }}>
            Consult <strong>{result.doctor_recommendation || 'General Physician'}</strong>
          </p>
        </div>

        {/* Disease Progression */}
        <div className="info-section-box full-width">
          <div className="section-box-title"><Layers size={18} /> Disease Progression</div>
          {result.progression ? (
            <div style={{ marginTop: '1.5rem', padding: '0 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {/* Connector line */}
                <div style={{ position: 'absolute', top: '11px', left: '8%', right: '8%', height: '2px', background: 'var(--border)', zIndex: 0 }} />
                {['early', 'moderate', 'severe'].map((stage, i) => (
                  <div key={stage} style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '30%' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: stageColors[i],
                      margin: '0 auto 10px auto',
                      border: '4px solid #fff',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }} />
                    <div style={{ fontWeight: '800', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      {stage === 'early' ? '🟢 Early' : stage === 'moderate' ? '🟡 Moderate' : '🔴 Severe'}
                    </div>
                    <p style={{ fontSize: '0.84rem', lineHeight: '1.45', padding: '0 4px', color: 'var(--text)' }}>
                      {result.progression[stage]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '8px' }}>
              Progression data not available for this condition.
            </p>
          )}
        </div>

        {/* Affected Organs */}
        <div className="info-section-box full-width">
          <div className="section-box-title" style={{ margin: 0 }}>Affected Organs</div>
          <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text)' }}>{result.affected_organ}</span>
        </div>
      </div>

<<<<<<< HEAD
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
=======
      {/* Footer button */}
      <div className="card-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => navigate(`/more-details/${encodeURIComponent(result.disease)}`)}
>>>>>>> b3d9ddf (Added my feature updates)
          className="search-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--secondary)', color: 'var(--accent)', border: '1px solid var(--accent)', boxShadow: 'none' }}
        >
          View More Clinical Details <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
const Dashboard = ({ query, setQuery, handleSearch, loading, error, results, setResults, navigate }) => {
  const inputRef = useRef(null);
<<<<<<< HEAD
  const [isListening, setIsListening] = useState(false);
=======
  const [selectedDiseases, setSelectedDiseases] = useState([]);
  const [history, setHistory]                   = useState([]);
>>>>>>> b3d9ddf (Added my feature updates)

  // Load history from localStorage on mount and whenever results change
  useEffect(() => { setHistory(loadHistory()); }, [results]);

  // Keep input focused after re-renders
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, [results]);

  // ── History handlers ────────────────────────────────────────────────────
  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  const deleteHistoryItem = (e, id) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const loadFromHistory = (item) => {
    setQuery(item.symptoms);
    setResults(item.results);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // ── Compare handlers ────────────────────────────────────────────────────
  const toggleDiseaseSelection = (name) => {
    setSelectedDiseases(prev => {
      if (prev.includes(name)) return prev.filter(d => d !== name);
      if (prev.length >= 2)    return prev;   // max 2
      return [...prev, name];
    });
  };

  const handleCompare = () => {
    if (selectedDiseases.length === 2)
      navigate('/compare', { state: { selectedDiseases } });
  };

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
      {/* Hero */}
      <div className="hero">
        <h1>Genomic Disease Prediction System</h1>
        <p>Professional AI-powered diagnostic platform</p>
      </div>

      {/* Search box */}
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

        {/* ── Patient History ─────────────────────────────────────────────── */}
        <div style={{ marginTop: '1.5rem', width: '100%', maxWidth: '800px', marginInline: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>
              <HistoryIcon size={16} /> Recent Searches
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
            {history.length > 0 ? history.map((item) => (
              <div
                key={item.id}
                onClick={() => loadFromHistory(item)}
                style={{
                  flex: '0 0 auto', position: 'relative',
                  background: '#fff', border: '1px solid var(--border)',
                  padding: '8px 14px', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '0.85rem',
                  transition: 'border-color 0.2s ease',
                  display: 'flex', flexDirection: 'column', gap: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  const btn = e.currentTarget.querySelector('.del-btn');
                  if (btn) btn.style.opacity = '1';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  const btn = e.currentTarget.querySelector('.del-btn');
                  if (btn) btn.style.opacity = '0';
                }}
              >
                {/* Individual delete button */}
                <button
                  className="del-btn"
                  onClick={(e) => deleteHistoryItem(e, item.id)}
                  style={{
                    position: 'absolute', top: '-8px', right: '-8px',
                    background: '#ff4d4d', color: '#fff',
                    border: 'none', borderRadius: '50%',
                    width: '20px', height: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', opacity: '0',
                    transition: 'opacity 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)', zIndex: 2
                  }}
                >
                  <X size={12} />
                </button>

                <span style={{ fontWeight: '700', color: 'var(--text)', whiteSpace: 'nowrap', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.symptoms}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {item.timestamp.split(',')[1]?.trim() || item.timestamp}
                </span>
              </div>
            )) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '4px' }}>No previous searches</p>
            )}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader2 className="spinner" size={48} style={{ margin: '0 auto 20px auto', color: 'var(--accent)' }} />
          <p style={{ fontWeight: '700', color: 'var(--accent)', letterSpacing: '1px' }}>PROCESSING GENOMIC BIOMARKERS...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-msg">
          <AlertCircle size={24} />
          <p style={{ marginTop: '10px' }}>{error}</p>
        </div>
      )}

      {/* Results */}
      {results && (Array.isArray(results) ? results.length > 0 : Object.keys(results).length > 0) && (
        <div className="content-layout" style={{ position: 'relative' }}>

          {/* ── Floating Compare Bar ────────────────────────────────────────── */}
          {selectedDiseases.length > 0 && (
            <div style={{
              position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
              background: '#fff', padding: '0.85rem 1.8rem',
              borderRadius: '50px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.12)',
              display: 'flex', alignItems: 'center', gap: '18px',
              zIndex: 1000, border: '1px solid var(--border)',
              animation: 'slideUp 0.3s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitCompare size={20} color="var(--accent)" />
                <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{selectedDiseases.length} / 2 Selected</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedDiseases.map(d => (
                  <span key={d} className="gene-tag" style={{ background: 'rgba(14,165,233,0.1)', border: 'none' }}>{d}</span>
                ))}
              </div>
              <button
                onClick={handleCompare}
                disabled={selectedDiseases.length !== 2}
                className="search-btn"
                style={{ padding: '0.55rem 1.4rem', opacity: selectedDiseases.length === 2 ? 1 : 0.5, cursor: selectedDiseases.length === 2 ? 'pointer' : 'not-allowed' }}
              >
                Compare Diseases
              </button>
            </div>
          )}

          {/* Disease cards */}
          <div className="results-container">
<<<<<<< HEAD
            {!Array.isArray(results) 
              ? <RenderDiseaseCard result={results} isTop={true} navigate={navigate} />
              : results.map((res, i) => <RenderDiseaseCard key={i} result={res} isTop={i === 0} index={i} navigate={navigate} />)
          }
          {Array.isArray(results) && results.length > 1 && (
            <DiseaseComparison results={results} />
          )}
        </div>
=======
            {!Array.isArray(results)
              ? <RenderDiseaseCard result={results} isTop={true} navigate={navigate}
                  selectedDiseases={selectedDiseases} onToggleSelection={toggleDiseaseSelection} />
              : results.map((res, i) =>
                  <RenderDiseaseCard key={i} result={res} isTop={i === 0} index={i} navigate={navigate}
                    selectedDiseases={selectedDiseases} onToggleSelection={toggleDiseaseSelection} />
                )
            }
          </div>
>>>>>>> b3d9ddf (Added my feature updates)

          {/* Anatomy sidebar */}
          <div className="visualization-sidebar">
            <AnatomyVisualization
              disease={Array.isArray(results) ? results[0]?.disease : results?.disease}
              affectedOrgan={Array.isArray(results) ? results[0]?.affected_organ : results?.affected_organ}
            />
          </div>
        </div>
      )}

      {/* No results */}
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
