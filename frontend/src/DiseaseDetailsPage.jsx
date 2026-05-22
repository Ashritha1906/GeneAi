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
  ExternalLink,
  FileText,
  Calendar,
  CheckCircle2,
  Database
} from 'lucide-react';

const DiseaseDetailsPage = () => {
  const { diseaseName } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('DiseaseDetailsPage: Fetching data for', diseaseName);
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:5000/more-details?disease=${encodeURIComponent(diseaseName)}`);
        console.log('DiseaseDetailsPage: Dataset data received:', response.data);
        setData(response.data);
      } catch (err) {
        console.error('DiseaseDetailsPage: Error fetching details:', err);
        setError('Failed to fetch detailed data. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    if (diseaseName) {
      fetchData();
    }
  }, [diseaseName]);

  const renderSafeValue = (val) => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'object') {
      return val.value || JSON.stringify(val);
    }
    return String(val);
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 className="spinner" size={48} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
        <p style={{ fontWeight: '600', color: 'var(--text-muted)' }}>LOADING GENOMIC DATASET...</p>
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

  const hasData = data && (
    (data.genes && Array.isArray(data.genes) && data.genes.length > 0) || 
    (data.variants && Array.isArray(data.variants) && data.variants.length > 0) || 
    (data.conditions && Array.isArray(data.conditions) && data.conditions.length > 0)
  );

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
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>There is a possibility of {diseaseName} based on symptoms</h1>
        <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} /> Verified Clinical & Genomic Report
        </p>
      </div>

      {!hasData ? (
        <div className="no-data" style={{ 
          textAlign: 'center', 
          padding: '6rem 2rem', 
          background: 'var(--secondary)', 
          borderRadius: '24px', 
          border: '1px solid var(--border)',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{ marginBottom: '1.5rem', opacity: 0.5 }}>
            <Activity size={64} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text)' }}>No data available</h3>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
            We couldn't find a local genomic record for "{diseaseName}" in our current dataset.
          </p>
          <button onClick={() => navigate(-1)} className="search-btn" style={{ padding: '0.8rem 2.5rem' }}>
            Try Another Search
          </button>
        </div>
      ) : (
        <div className="details-grid" style={{ display: 'grid', gap: '3rem' }}>
          
          {/* Genes Table */}
          {data?.genes?.length > 0 && (
            <div className="info-section-box full-width">
              <div className="section-box-title" style={{ background: '#004a99', color: 'white' }}>
                <Dna size={20} /> Genes
              </div>
              <div className="table-responsive">
                <table className="details-table ncbi-style">
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Gene</th>
                      <th style={{ width: '40%' }}>Prevalence Region (India)</th>
                      <th style={{ width: '30%' }}>OMIM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.genes.map((gene, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: '700' }}>
                          <a 
                            href={`https://www.ncbi.nlm.nih.gov/gene/?term=${encodeURIComponent(renderSafeValue(gene.gene))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#004a99', textDecoration: 'none' }}
                            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                          >
                            {renderSafeValue(gene.gene)}
                          </a>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            background: '#e8f4fd',
                            color: '#004a99',
                            borderRadius: '6px',
                            padding: '3px 10px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}>
                            {renderSafeValue(gene.region) !== 'N/A' && renderSafeValue(gene.region) !== 'undefined'
                              ? renderSafeValue(gene.region)
                              : 'Data not available'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a 
                              href={`https://www.ncbi.nlm.nih.gov/search/all/?term=${renderSafeValue(gene.omim)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#004a99', textDecoration: 'none' }}
                              onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                              onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                            >
                              {renderSafeValue(gene.omim)}
                            </a>
                            <ExternalLink size={14} style={{ color: '#004a99' }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Variants Table */}
          {data?.variants?.length > 0 && (
            <div className="info-section-box full-width">
              <div className="section-box-title" style={{ background: '#004a99', color: 'white' }}>
                <FlaskConical size={20} /> Variant Details
              </div>
              <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table className="details-table ncbi-style">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      <th>Variation</th>
                      <th>Protein Change</th>
                      <th>Consequence</th>
                      <th>Condition</th>
                      <th>Review Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.variants.map((variant, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>
                          <a 
                            href={`https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(renderSafeValue(variant.variation))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#004a99', textDecoration: 'none' }}
                            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                          >
                            {renderSafeValue(variant.variation)}
                          </a>
                        </td>
                        <td>{renderSafeValue(variant.protein_change)}</td>
                        <td>{renderSafeValue(variant.consequence)}</td>
                        <td>
                          <a 
                            href={`https://www.ncbi.nlm.nih.gov/medgen/?term=${encodeURIComponent(renderSafeValue(variant.condition))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#004a99', textDecoration: 'none' }}
                            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                          >
                            {renderSafeValue(variant.condition)}
                          </a>
                        </td>
                        <td>
                          <span style={{ 
                            fontSize: '0.85rem', 
                            color: renderSafeValue(variant.review_status).toLowerCase().includes('pathogenic') ? '#d32f2f' : '#2e7d32',
                            fontWeight: '600'
                          }}>
                            {renderSafeValue(variant.review_status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Conditions Table */}
          {data?.conditions?.length > 0 && (
            <div className="info-section-box full-width">
              <div className="section-box-title" style={{ background: '#004a99', color: 'white' }}>
                <Activity size={20} /> Conditions - Germline
              </div>
              <div className="table-responsive">
                <table className="details-table ncbi-style">
                  <thead>
                    <tr>
                      <th>Condition</th>
                      <th>Classification</th>
                      <th>Review Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.conditions.map((cond, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: '600' }}>
                          <a 
                            href={`https://www.ncbi.nlm.nih.gov/medgen/?term=${encodeURIComponent(renderSafeValue(cond.condition))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#004a99', textDecoration: 'none' }}
                            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                          >
                            {renderSafeValue(cond.condition)}
                          </a>
                        </td>
                        <td>{renderSafeValue(cond.classification)}</td>
                        <td style={{ color: '#fbc02d', letterSpacing: '2px' }}>{renderSafeValue(cond.review_status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', borderTop: '1px solid var(--border)', padding: '2rem' }}>
        <p>GenoPredict Bioinformatics Platform - Verified Genomic Dataset Access</p>
      </div>
    </div>
  );
};

export default DiseaseDetailsPage;
