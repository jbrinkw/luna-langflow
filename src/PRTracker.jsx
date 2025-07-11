import React, { useEffect, useState } from 'react';

export default function PRTracker({ onBack }) {
  const [prs, setPRs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPRs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/prs');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setPRs(data);
      setError(null);
    } catch (err) {
      console.error('Error loading PRs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPRs();
  }, []);

  // Styles
  const containerStyle = {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px'
  };

  const backButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  const titleStyle = {
    margin: 0,
    color: '#333',
    fontSize: '24px'
  };

  const exerciseCardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #ddd'
  };

  const exerciseNameStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
    textTransform: 'capitalize'
  };

  const prListStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  };

  const prItemStyle = {
    backgroundColor: '#f8f9fa',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    fontWeight: 'bold'
  };

  const loadingStyle = {
    textAlign: 'center',
    color: '#666',
    fontSize: '16px'
  };

  const errorStyle = {
    textAlign: 'center',
    color: '#dc3545',
    fontSize: '16px'
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '40px',
    border: '2px dashed #ddd',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
    color: '#666'
  };

  const noDataStyle = {
    color: '#666',
    fontStyle: 'italic',
    fontSize: '14px'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>💪 Personal Records</h1>
          <button style={backButtonStyle} onClick={onBack}>Back</button>
        </div>
        <div style={loadingStyle}>
          <p>Loading your PRs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>💪 Personal Records</h1>
          <button style={backButtonStyle} onClick={onBack}>Back</button>
        </div>
        <div style={errorStyle}>
          <p>Error loading PRs: {error}</p>
        </div>
      </div>
    );
  }

  const exerciseNames = Object.keys(prs);
  const hasData = exerciseNames.length > 0;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>💪 Personal Records</h1>
        <button style={backButtonStyle} onClick={onBack}>Back</button>
      </div>

      {!hasData ? (
        <div style={emptyStateStyle}>
          <h3>No PRs tracked yet</h3>
          <p>Complete some workouts with bench press, squat, or deadlift to see your personal records here!</p>
        </div>
      ) : (
        <div>
          {exerciseNames.map(exercise => (
            <div key={exercise} style={exerciseCardStyle}>
              <h2 style={exerciseNameStyle}>{exercise}</h2>
              {prs[exercise] && prs[exercise].length > 0 ? (
                <div style={prListStyle}>
                  {prs[exercise].map((pr, index) => (
                    <div key={index} style={prItemStyle}>
                      {pr.reps} rep{pr.reps !== 1 ? 's' : ''}: {pr.maxLoad} lbs
                    </div>
                  ))}
                </div>
              ) : (
                <div style={noDataStyle}>No PRs recorded for this exercise yet</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 