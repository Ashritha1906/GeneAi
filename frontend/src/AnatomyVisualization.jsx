import React from 'react';
import './AnatomyVisualization.css';

const AnatomyVisualization = ({ disease, affectedOrgan }) => {
  const diseaseToOrganMap = {
    "thalassemia": "blood / bone marrow",
    "cystic fibrosis": "lungs",
    "parkinson’s disease": "brain",
    "parkinson's disease": "brain",
    "parkinson’s": "brain",
    "parkinson's": "brain",
    "breast cancer": "breast",
    "hypertrophic cardiomyopathy": "heart",
    "cardiomyopathy": "heart",
    "sickle cell anemia": "blood",
    "hemophilia": "blood",
    "lung cancer": "lungs",
    "alzheimer's disease": "brain"
  };

  const normalizedDisease = disease ? disease.toLowerCase().trim() : "";
  const organ = affectedOrgan || diseaseToOrganMap[normalizedDisease] || "";
  
  const organIdMap = {
    "brain": "brain-point",
    "lungs": "lungs-point",
    "heart": "heart-point",
    "breast": "breast-point",
    "blood": "blood-point",
    "blood / bone marrow": "blood-point"
  };

  const activeClass = organ ? organIdMap[organ.toLowerCase().trim()] || '' : '';

  return (
    <div className="anatomy-visualization">
      <style>{`
        @keyframes organPop {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          70% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.8); border-color: rgba(248, 113, 113, 1); }
          70% { box-shadow: 0 0 0 20px rgba(248, 113, 113, 0); border-color: rgba(248, 113, 113, 0.5); }
          100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); border-color: rgba(248, 113, 113, 1); }
        }
        .organ-highlight-circle.active {
          animation: organPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, 
                     pulseRing 2.5s infinite ease-in-out 0.8s !important;
          border-color: #f87171 !important;
          background: rgba(248, 113, 113, 0.2) !important;
          opacity: 1 !important;
        }
      `}</style>

      <h3 style={{ fontSize: '1.4rem', marginBottom: '1.2rem' }}>Clinical Observation</h3>
      <div className="anatomy-container">
        <div className="image-wrapper">
          <img src="/body_3d.png" alt="Futuristic Anatomy" className="body-3d-image" />
          <div className="overlay-scanline"></div>
          
          <div className="marker-system">
            <div className={`organ-highlight-circle brain-point ${activeClass === 'brain-point' ? 'active' : ''}`}></div>
            <div className={`organ-highlight-circle lungs-point ${activeClass === 'lungs-point' ? 'active' : ''}`}></div>
            <div className={`organ-highlight-circle heart-point ${activeClass === 'heart-point' ? 'active' : ''}`}></div>
            <div className={`organ-highlight-circle breast-point ${activeClass === 'breast-point' ? 'active' : ''}`}></div>
            <div className={`organ-highlight-circle blood-point ${activeClass === 'blood-point' ? 'active' : ''}`}></div>
          </div>
        </div>
      </div>

      {organ && (
        <div className="affected-organ-label-below" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          padding: '1.2rem'
        }}>
          <div className="section-subtitle" style={{ 
            fontSize: '1.4rem', 
            color: '#38bdf8', 
            fontWeight: '700', 
            textTransform: 'uppercase', 
            letterSpacing: '1.5px', 
            marginBottom: '0.4rem',
            textShadow: '0 0 10px rgba(56, 189, 248, 0.3)'
          }}>
            Targeted System
          </div>
          <div className="label-content" style={{ 
            fontSize: '0.95rem', 
            color: 'rgba(255, 255, 255, 0.6)', 
            fontWeight: '400',
            textTransform: 'none',
            letterSpacing: '0.5px'
          }}>
            Affected Organ: <span style={{ color: '#fff', fontWeight: '600', textTransform: 'capitalize' }}>{organ}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnatomyVisualization;
