import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Dna, 
  FlaskConical, 
  Activity, 
  Loader2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

const DiseaseDetailsPage = () => {
  const { diseaseName } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:5000/more-details?disease=${encodeURIComponent(diseaseName)}`);
        console.log('DEBUG: NCBI data received:', response.data);
        setData(response.data);
      } catch (err) {
        console.error('Error fetching details:', err);
        setError('Failed to fetch detailed genomic data from NCBI.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [diseaseName]);

  if (loading) {
    return (
      <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 className="spinner" size={48} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
        <p style={{ fontWeight: '600', color: 'var(--text-muted)' }}>FETCHING REAL-TIME GENOMIC DATA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container" style={{ textAlign: 'center', padding: '4rem' }}>
        <AlertCircle size={48} color="#ff4d4d" style={{ marginBottom: '1rem' }} />
        <h3>Data Retrieval Error</h3>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="search-btn" style={{ marginTop: '2rem' }}>
          Go Back
        </button>
      </div>
    );
  }

  const hasData = data && (data.genes.length > 0 || data.variants.length > 0 || data.conditions.length > 0);

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
        <ArrowLeft size={20} /> Back to Search Results
      </button>

      <div className="details-header" style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{diseaseName}</h1>
        <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} /> Detailed Clinical & Genomic Report
        </p>
      </div>

      {!hasData ? (
        <div className="no-data" style={{ textAlign: 'center', padding: '4rem', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>No additional genomic data found in NCBI databases for this condition.</p>
        </div>
      ) : (
        <div className="details-grid" style={{ display: 'grid', gap: '2rem' }}>
          
          {/* Genes Section */}
          {data.genes.length > 0 && (
            <div className="info-section-box full-width">
              <div className="section-box-title"><Dna size={20} /> Genomic Associations (NCBI Gene)</div>
              <div className="table-responsive">
                <table className="details-table">
                  <thead>
                    <tr>
                      <th>Gene Symbol</th>
                      <th>Description / Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.genes.map((gene, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: '700', color: 'var(--accent)' }}>{gene.name}</td>
                        <td>{gene.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Variants Section */}
          {data.variants.length > 0 && (
            <div className="info-section-box full-width">
              <div className="section-box-title"><FlaskConical size={20} /> Clinical Variants (ClinVar)</div>
              <div className="table-responsive">
                <table className="details-table">
                  <thead>
                    <tr>
                      <th>Variant UID</th>
                      <th>Clinical Significance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.variants.map((variant, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'monospace' }}>{variant.id}</td>
                        <td>
                          <span className="risk-pill" style={{ 
                            background: variant.clinical_significance.toLowerCase().includes('pathogenic') ? 'rgba(255, 77, 77, 0.1)' : 'rgba(77, 255, 140, 0.1)',
                            color: variant.clinical_significance.toLowerCase().includes('pathogenic') ? '#ff4d4d' : '#4dff8c',
                            border: 'none',
                            fontSize: '0.8rem'
                          }}>
                            {variant.clinical_significance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Conditions Section */}
          {data.conditions.length > 0 && (
            <div className="info-section-box full-width">
              <div className="section-box-title"><Activity size={20} /> Related Conditions (MedGen)</div>
              <div className="table-responsive">
                <table className="details-table">
                  <thead>
                    <tr>
                      <th>Condition Name</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.conditions.map((cond, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: '600' }}>{cond.name}</td>
                        <td style={{ fontSize: '0.9rem' }}>{cond.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        <p>Data provided by National Center for Biotechnology Information (NCBI) E-Utilities API.</p>
      </div>
    </div>
  );
};

export default DiseaseDetailsPage;
