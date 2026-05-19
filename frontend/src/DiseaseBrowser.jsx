import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Dna, Activity, ShieldCheck, Stethoscope, RefreshCw, FlaskConical,
  MapPin, FileText, UserCheck, ArrowLeft, Loader2, AlertCircle,
  ExternalLink, Send, MessageSquare, Search
} from 'lucide-react';

const DISEASE_TAGLINES = {
  "Thalassemia": "Genetic Blood Disorder", "Sickle Cell Disease": "Inherited Red Blood Cell Disorder",
  "Glucose-6-Phosphate Dehydrogenase Deficiency": "X-linked Enzyme Deficiency",
  "Breast Cancer": "Genetic Oncological Condition", "Parkinson's Disease": "Progressive Neurological Disorder",
  "Hemophilia": "Clotting Factor Deficiency", "Familial Hypercholesterolemia": "Inherited Cholesterol Disorder",
  "Cystic Fibrosis": "Genetic Lung & Digestive Disease", "Hypertrophic Cardiomyopathy": "Inherited Heart Muscle Disease",
  "Hereditary Anemia": "Inherited Blood Disorder"
};

const RISK_MAP = {
  "Thalassemia": "High", "Sickle Cell Disease": "High", "Breast Cancer": "High",
  "Parkinson's Disease": "Medium", "Hemophilia": "High", "Familial Hypercholesterolemia": "Medium",
  "Cystic Fibrosis": "High", "Hypertrophic Cardiomyopathy": "High",
  "Glucose-6-Phosphate Dehydrogenase Deficiency": "Medium", "Hereditary Anemia": "Medium"
};

const KEY_FACTS = {
  "Thalassemia":                                  ["Caused by mutations in the HBB gene", "Leads to chronic anemia and fatigue", "Common in India's coastal & tribal regions", "Severe cases need lifelong transfusions"],
  "Sickle Cell Disease":                          ["Abnormal sickle-shaped red blood cells", "Causes painful episodes called 'crises'", "Highly prevalent in central India", "Inherited in autosomal recessive pattern"],
  "Glucose-6-Phosphate Dehydrogenase Deficiency": ["X-linked enzyme deficiency, mostly in males", "Triggered by fava beans, infections, or drugs", "Causes sudden red blood cell destruction", "Usually asymptomatic without a trigger"],
  "Breast Cancer":                                ["Linked to BRCA1 & BRCA2 gene mutations", "Most common cancer in women", "Early detection greatly improves outcomes", "Treatable with surgery, chemo & targeted therapy"],
  "Parkinson's Disease":                          ["Progressive loss of dopamine neurons", "Starts with mild tremors and stiffness", "10–15% of cases have a genetic link", "Managed with medication; no cure yet"],
  "Hemophilia":                                   ["Blood fails to clot due to missing clotting factor", "X-linked recessive — mainly affects males", "Risk of dangerous internal bleeding", "Treated with regular factor replacement"],
  "Familial Hypercholesterolemia":                ["Very high LDL cholesterol from birth", "Caused by LDLR, APOB, or PCSK9 mutations", "Leads to early-onset heart disease", "Managed with statins and lifestyle changes"],
  "Cystic Fibrosis":                              ["Caused by mutations in the CFTR gene", "Thick mucus clogs lungs and digestive system", "Leads to persistent infections and poor growth", "CFTR modulator therapies have improved outcomes"],
  "Hypertrophic Cardiomyopathy":                  ["Heart muscle becomes abnormally thick", "Leading cause of sudden cardiac death in athletes", "Many patients are asymptomatic for years", "Managed with medications or ICD implants"],
  "Hereditary Anemia":                            ["Umbrella term for genetic red blood cell disorders", "Includes thalassemia, spherocytosis & more", "Causes chronic fatigue and pale skin", "Treatment varies by specific subtype"]
};

export default function DiseaseBrowser() {
  const navigate = useNavigate();
  const [diseases, setDiseases]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch]         = useState('');
  const [chatMsg, setChatMsg]       = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const chatRef = useRef(null);

  useEffect(() => {
    axios.get('http://localhost:5000/get-all-diseases')
      .then(r => setDiseases(r.data.diseases || []))
      .catch(() => setDiseases([]));
  }, []);

  const selectDisease = async (name) => {
    setSelected(name); setData(null); setLoading(true); setChatHistory([]);
    try {
      const r = await axios.get(`http://localhost:5000/disease-full?name=${encodeURIComponent(name)}`);
      setData(r.data);
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  const handleChat = async () => {
    if (!chatMsg.trim() || !selected) return;
    const question = chatMsg.trim();
    setChatHistory(h => [...h, { role: 'user', text: question }]);
    setChatMsg('');
    // Generate a contextual answer from the data we have
    const answer = generateAnswer(question, data, selected);
    setTimeout(() => {
      setChatHistory(h => [...h, { role: 'bot', text: answer }]);
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, 600);
  };

  const generateAnswer = (q, d, disease) => {
    const ql = q.toLowerCase();
    if (!d) return `I don't have enough data about ${disease} right now.`;
    if (ql.includes('symptom')) return `Common symptoms of ${disease}: ${d.symptoms?.join(', ') || 'fatigue, weakness, and other condition-specific symptoms.'}`;
    if (ql.includes('cause')) return `Causes of ${disease}: ${d.causes || 'Genetic mutations are the primary cause.'}`;
    if (ql.includes('treat') || ql.includes('recov')) return `Treatment: ${d.recovery_treatment || d.prevention || 'Consult a specialist for a personalised plan.'}`;
    if (ql.includes('doctor') || ql.includes('specialist')) return `Recommended specialist for ${disease}: ${d.doctor_recommendation || 'General Physician'}.`;
    if (ql.includes('prevent')) return `Prevention: ${d.prevention || 'Regular screening and genetic counseling are recommended.'}`;
    if (ql.includes('organ')) return `${disease} primarily affects: ${d.affected_organ || 'Multiple organs'}.`;
    if (ql.includes('gene')) return `Key genes involved: ${d.genes?.slice(0,5).map(g=>g.gene).join(', ') || 'See the Gene table below.'}.`;
    if (ql.includes('india') || ql.includes('region')) return `Prevalence in India: ${d.prevalence_in_india || 'Data not available.'}`;
    return `${disease} is a genetic condition. ${d.description?.substring(0, 200) || ''}... Ask me about symptoms, causes, treatment, genes, or doctor recommendations.`;
  };

  const handleDownloadPDF = () => {
    if (!data) return;
    window.print();
  };

  const filteredDiseases = diseases.filter(d => d.toLowerCase().includes(search.toLowerCase()));
  const riskColor = selected ? (RISK_MAP[selected] === 'High' ? '#ef4444' : RISK_MAP[selected] === 'Medium' ? '#f59e0b' : '#10b981') : '#10b981';

  const safe = (v) => { if (v === null || v === undefined) return 'N/A'; if (typeof v === 'object') return v.value || JSON.stringify(v); return String(v); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: 'var(--bg, #f8fafc)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <div style={{
        width: sidebarOpen ? '220px' : '40px',
        minWidth: sidebarOpen ? '220px' : '40px',
        background: '#fff',
        borderRight: '1px solid #d0d7de',
        overflowY: sidebarOpen ? 'auto' : 'hidden',
        overflowX: 'hidden',
        transition: 'width 0.3s ease, min-width 0.3s ease',
        flexShrink: 0,
        boxShadow: '2px 0 6px rgba(0,0,0,0.04)',
        position: 'relative'
      }}>

        {/* Collapsed strip — visible when sidebar is closed */}
        {!sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(true)}
            title="Open Disease Library"
            style={{
              width: '40px', height: '100%', minHeight: '100vh',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              paddingTop: '20px', gap: '6px', cursor: 'pointer',
              background: '#f6f8fa'
            }}
          >
            <div style={{ width: '20px', height: '2px', background: '#57606a', borderRadius: '2px' }} />
            <div style={{ width: '20px', height: '2px', background: '#57606a', borderRadius: '2px' }} />
            <div style={{ width: '20px', height: '2px', background: '#57606a', borderRadius: '2px' }} />
          </div>
        )}

        {/* Full sidebar — visible when open */}
        {sidebarOpen && (
          <>
            {/* Header */}
            <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #d0d7de', background: '#f6f8fa', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#57606a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Disease Library
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  title="Collapse"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#57606a', padding: '2px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid #d0d7de', borderRadius: '4px', padding: '4px 8px' }}>
                <Search size={13} color="#57606a" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter..."
                  style={{ border: 'none', outline: 'none', fontSize: '0.82rem', width: '100%', color: '#1f2328', background: 'transparent' }}
                />
              </div>
            </div>

            {/* Disease List */}
            <div>
              {filteredDiseases.map((d, i) => (
                <div
                  key={d}
                  onClick={() => selectDisease(d)}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    background: selected === d ? '#0969da' : 'transparent',
                    color: selected === d ? '#ffffff' : '#1f2328',
                    fontWeight: selected === d ? '600' : '400',
                    borderBottom: i < filteredDiseases.length - 1 ? '1px solid #f0f0f0' : 'none',
                    transition: 'background 0.15s ease',
                    userSelect: 'none'
                  }}
                  onMouseOver={e => { if (selected !== d) e.currentTarget.style.background = '#f0f6ff'; }}
                  onMouseOut={e => { if (selected !== d) e.currentTarget.style.background = 'transparent'; }}
                >
                  {d}
                </div>
              ))}
              {filteredDiseases.length === 0 && (
                <div style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#57606a' }}>No results</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {/* Top nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--accent,#0ea5e9)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.9rem', padding: '0' }}>
            <ArrowLeft size={18} /> Back
          </button>
        </div>

        {/* Empty state */}
        {!selected && (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#94a3b8' }}>
            <Dna size={64} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
            <h2 style={{ fontWeight: '800', fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--text, #1e293b)' }}>Disease Encyclopedia</h2>
            <p style={{ fontSize: '1rem' }}>Select any disease from the sidebar to view its complete clinical profile.</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '6rem' }}>
            <Loader2 className="spinner" size={48} style={{ color: 'var(--accent,#0ea5e9)', marginBottom: '1rem' }} />
            <p style={{ fontWeight: '600', color: '#94a3b8' }}>Loading clinical data...</p>
          </div>
        )}

        {/* Disease Dashboard */}
        {!loading && data && selected && (
          <div style={{ maxWidth: '900px' }}>

            {/* ── 1. Header ── */}
            <div style={{ background: 'linear-gradient(135deg, #004a99, #0ea5e9)', borderRadius: '20px', padding: '32px', color: '#fff', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '0.85rem', opacity: 0.8, letterSpacing: '1px', textTransform: 'uppercase' }}>{DISEASE_TAGLINES[selected] || 'Genetic Condition'}</p>
                  <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '900' }}>{selected}</h1>
                  <p style={{ margin: '10px 0 0', opacity: 0.9, fontSize: '0.92rem', lineHeight: 1.65, maxWidth: '560px' }}>
                    {(KEY_FACTS[selected] || ['A genetic condition requiring specialist care.']).join('. ')}.
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '4px 16px', fontSize: '0.85rem', fontWeight: '700' }}>
                    Risk: {RISK_MAP[selected] || 'Variable'}
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '0.82rem' }}>
                    🫀 {data.affected_organ}
                  </span>
                </div>
              </div>
            </div>

            {/* ── 2. Quick Info Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'Affected Organ', value: data.affected_organ, icon: <Activity size={18} /> },
                { label: 'Recommended Doctor', value: data.doctor_recommendation, icon: <UserCheck size={18} /> },
                { label: 'Prevalence (India)', value: data.prevalence_in_india, icon: <MapPin size={18} /> },
              ].map((item, i) => (
                <div key={i} className="info-section-box" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent,#0ea5e9)', fontWeight: '700', fontSize: '0.82rem', marginBottom: '8px', textTransform: 'uppercase' }}>
                    {item.icon} {item.label}
                  </div>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '1rem' }}>{item.value || 'N/A'}</p>
                </div>
              ))}
            </div>

            {/* ── 3. Symptoms ── */}
            {data.symptoms?.length > 0 && (
              <div className="info-section-box full-width" style={{ marginBottom: '20px' }}>
                <div className="section-box-title"><Stethoscope size={18} /> Symptoms</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  {data.symptoms.filter(s => s.length > 2).map((s, i) => (
                    <span key={i} style={{ background: 'rgba(14,165,233,0.08)', color: 'var(--accent,#0ea5e9)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '20px', padding: '5px 14px', fontSize: '0.85rem', fontWeight: '600' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ── 4. Causes & Prevention ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="info-section-box">
                <div className="section-box-title"><ShieldCheck size={18} /> Causes</div>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.6, marginTop: '8px' }}>{data.causes}</p>
              </div>
              <div className="info-section-box">
                <div className="section-box-title"><RefreshCw size={18} /> Prevention</div>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.6, marginTop: '8px' }}>{data.prevention}</p>
              </div>
            </div>

            {/* ── 5. Gene Table ── */}
            {data.genes?.length > 0 && (
              <div className="info-section-box full-width" style={{ marginBottom: '20px', padding: 0, overflow: 'hidden' }}>
                <div className="section-box-title" style={{ background: '#004a99', color: '#fff', borderRadius: '12px 12px 0 0' }}>
                  <Dna size={18} /> Gene Information
                </div>
                <div className="table-responsive">
                  <table className="details-table ncbi-style" style={{ margin: 0 }}>
                    <thead><tr>
                      <th style={{ width: '30%' }}>Gene</th>
                      <th style={{ width: '40%' }}>Prevalence Region (India)</th>
                      <th style={{ width: '30%' }}>OMIM</th>
                    </tr></thead>
                    <tbody>
                      {data.genes.map((g, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: '700' }}>
                            <a href={`https://www.ncbi.nlm.nih.gov/gene/?term=${encodeURIComponent(safe(g.gene))}`} target="_blank" rel="noreferrer" style={{ color: '#004a99', textDecoration: 'none' }}
                              onMouseOver={e=>e.target.style.textDecoration='underline'} onMouseOut={e=>e.target.style.textDecoration='none'}>
                              {safe(g.gene)}
                            </a>
                          </td>
                          <td>
                            <span style={{ background: '#e8f4fd', color: '#004a99', borderRadius: '6px', padding: '3px 10px', fontSize: '0.83rem', fontWeight: '600' }}>
                              {g.region && g.region !== 'N/A' ? g.region : 'Data not available'}
                            </span>
                          </td>
                          <td>
                            <a href={`https://www.ncbi.nlm.nih.gov/search/all/?term=${safe(g.omim)}`} target="_blank" rel="noreferrer" style={{ color: '#004a99', textDecoration: 'none', display:'flex', alignItems:'center', gap:'6px' }}
                              onMouseOver={e=>e.currentTarget.style.textDecoration='underline'} onMouseOut={e=>e.currentTarget.style.textDecoration='none'}>
                              {safe(g.omim)} <ExternalLink size={13} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── 6. Variants Table ── */}
            {data.variants?.length > 0 && (
              <div className="info-section-box full-width" style={{ marginBottom: '20px', padding: 0, overflow: 'hidden' }}>
                <div className="section-box-title" style={{ background: '#004a99', color: '#fff', borderRadius: '12px 12px 0 0' }}>
                  <FlaskConical size={18} /> Variant Details
                </div>
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="details-table ncbi-style" style={{ margin: 0 }}>
                    <thead style={{ position: 'sticky', top: 0 }}><tr>
                      <th>Variation</th><th>Protein Change</th><th>Consequence</th><th>Condition</th><th>Review Status</th>
                    </tr></thead>
                    <tbody>
                      {data.variants.map((v, i) => (
                        <tr key={i}>
                          <td style={{ fontSize:'0.88rem', fontFamily:'monospace' }}>{safe(v.variation)}</td>
                          <td>{safe(v.protein_change)}</td>
                          <td>{safe(v.consequence)}</td>
                          <td>{safe(v.condition)}</td>
                          <td><span style={{ fontSize:'0.82rem', fontWeight:'600', color: safe(v.review_status).toLowerCase().includes('path') ? '#d32f2f' : '#2e7d32' }}>{safe(v.review_status)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── 7. Conditions Table ── */}
            {data.conditions?.length > 0 && (
              <div className="info-section-box full-width" style={{ marginBottom: '20px', padding: 0, overflow: 'hidden' }}>
                <div className="section-box-title" style={{ background: '#004a99', color: '#fff', borderRadius: '12px 12px 0 0' }}>
                  <Activity size={18} /> Conditions – Germline
                </div>
                <div className="table-responsive">
                  <table className="details-table ncbi-style" style={{ margin: 0 }}>
                    <thead><tr><th>Condition</th><th>Classification</th><th>Review Status</th></tr></thead>
                    <tbody>
                      {data.conditions.map((c, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: '600' }}>{safe(c.condition)}</td>
                          <td>{safe(c.classification)}</td>
                          <td style={{ color: '#f59e0b', fontWeight: '600' }}>{safe(c.review_status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── 8. Region in India ── */}
            <div className="info-section-box full-width" style={{ marginBottom: '20px' }}>
              <div className="section-box-title"><MapPin size={18} /> Regional Prevalence in India</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <p style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--accent,#0ea5e9)', margin: 0 }}>
                  📍 Common in: <strong>{data.common_states || data.prevalence_in_india || 'Nationwide / General'}</strong>
                </p>
                <a 
                  href={`/prevalence-map/${encodeURIComponent(selected)}?states=${encodeURIComponent(data.common_states || 'Nationwide')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="search-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'var(--accent, #0ea5e9)',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    alignSelf: 'flex-start',
                    boxShadow: 'none',
                    fontWeight: '700'
                  }}
                >
                  <MapPin size={16} /> Show in Map
                </a>
              </div>
            </div>

            {/* ── 9. Doctor Recommendation ── */}
            <div className="info-section-box full-width" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(0,74,153,0.04), rgba(14,165,233,0.06))', border: '1px solid rgba(14,165,233,0.2)' }}>
              <div className="section-box-title"><UserCheck size={18} /> Doctor Recommendation</div>
              <p style={{ fontSize: '1.2rem', marginTop: '10px', fontWeight: '400', color: 'var(--text,#1e293b)' }}>
                Consult a <strong style={{ color: 'var(--accent,#0ea5e9)', fontSize: '1.3rem' }}>{data.doctor_recommendation || 'General Physician'}</strong>
              </p>
            </div>

            {/* ── 10. AI Chat Assistant ── */}
            <div className="info-section-box full-width" style={{ marginBottom: '20px' }}>
              <div className="section-box-title"><MessageSquare size={18} /> Ask About {selected}</div>
              <div ref={chatRef} style={{ maxHeight: '220px', overflowY: 'auto', marginTop: '12px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px', scrollbarWidth: 'thin' }}>
                {chatHistory.length === 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['What are the symptoms?', 'Who should I consult?', 'How is it caused?', 'Which genes are involved?'].map(q => (
                      <button key={q} onClick={() => { setChatMsg(q); }} style={{ background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.2)', color: 'var(--accent,#0ea5e9)', borderRadius: '20px', padding: '5px 14px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: '600' }}>{q}</button>
                    ))}
                  </div>
                )}
                {chatHistory.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ background: m.role === 'user' ? 'var(--accent,#0ea5e9)' : '#f1f5f9', color: m.role === 'user' ? '#fff' : 'var(--text,#1e293b)', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 16px', maxWidth: '80%', fontSize: '0.88rem', lineHeight: 1.5 }}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()}
                  placeholder={`Ask anything about ${selected}...`}
                  style={{ flex: 1, padding: '10px 16px', border: '1px solid var(--border,#e2e8f0)', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', background: '#fff' }} />
                <button onClick={handleChat} style={{ background: 'var(--accent,#0ea5e9)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                  <Send size={16} /> Ask
                </button>
              </div>
            </div>

            {/* ── 11. Actions ── */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '40px' }}>
              <button onClick={() => navigate(`/more-details/${encodeURIComponent(selected)}`)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(14,165,233,0.08)', color: 'var(--accent,#0ea5e9)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: '12px', padding: '12px 24px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                <FileText size={18} /> Full Clinical Report
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
