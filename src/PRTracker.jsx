import React, { useEffect, useState } from 'react';

export default function PRTracker({ onBack }) {
  const [prs, setPRs] = useState({});
  const [tracked, setTracked] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const computeEstimated1RM = (reps, load) => Math.round(load * (1 + reps / 30));

  const processPRs = (data) => {
    const processed = {};
    for (const [exercise, prList] of Object.entries(data)) {
      const sorted = [...prList].sort((a, b) => a.reps - b.reps);
      const hasOneRM = sorted.some(pr => pr.reps === 1);
      if (!hasOneRM && sorted.length > 0) {
        const next = sorted[0];
        const estimated = computeEstimated1RM(next.reps, next.maxLoad);
        processed[exercise] = [
          { reps: 1, maxLoad: estimated, estimated: true },
          ...sorted
        ];
      } else {
        processed[exercise] = sorted;
      }
    }
    return processed;
  };

  const loadPRs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/prs');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setPRs(processPRs(data));
      setError(null);
    } catch (err) {
      console.error('Error loading PRs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTracked = async () => {
    try {
      const response = await fetch('/api/tracked-prs');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setTracked(data);
    } catch (err) {
      console.error('Error loading tracked PRs:', err);
    }
  };

  useEffect(() => {
    loadPRs();
    loadTracked();
  }, []);

  const saveTracked = async (exercise, reps, maxLoad) => {
    await fetch('/api/tracked-prs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise, reps, maxLoad })
    });
    loadTracked();
  };

  const deleteTracked = async (exercise, reps) => {
    await fetch('/api/tracked-prs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise, reps })
    });
    loadTracked();
  };

  const [newExercise, setNewExercise] = useState('');
  const [newReps, setNewReps] = useState('');
  const [newLoad, setNewLoad] = useState('');

  const handleAdd = async () => {
    if (!newExercise || !newReps || !newLoad) return;
    await saveTracked(newExercise, parseInt(newReps, 10), parseFloat(newLoad));
    setNewExercise('');
    setNewReps('');
    setNewLoad('');
  };

  const [editing, setEditing] = useState(null); // {exercise, reps}
  const [editLoad, setEditLoad] = useState('');

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

  const TrackedPRSection = () => {
    const names = Object.keys(tracked);
    return (
      <div>
        <h2 style={{ marginBottom: '10px' }}>Tracked PRs</h2>
        {names.length === 0 && (
          <div style={noDataStyle}>No tracked PRs</div>
        )}
        {names.map(ex => (
          <div key={ex} style={exerciseCardStyle}>
            <h3 style={exerciseNameStyle}>{ex}</h3>
            {tracked[ex].map(pr => (
              editing && editing.exercise === ex && editing.reps === pr.reps ? (
                <div key={pr.reps} style={{ marginBottom: '8px' }}>
                  <input
                    type="number"
                    value={editLoad}
                    onChange={e => setEditLoad(e.target.value)}
                    style={{ marginRight: '8px' }}
                  />
                  <button onClick={() => { saveTracked(ex, pr.reps, parseFloat(editLoad)); setEditing(null); }}>Save</button>
                  <button onClick={() => setEditing(null)}>Cancel</button>
                </div>
              ) : (
                <div key={pr.reps} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <div style={prItemStyle}>{pr.reps} reps: {pr.maxLoad} lbs</div>
                  <button onClick={() => { setEditing({ exercise: ex, reps: pr.reps }); setEditLoad(pr.maxLoad); }}>Edit</button>
                  <button onClick={() => deleteTracked(ex, pr.reps)}>Delete</button>
                </div>
              )
            ))}
          </div>
        ))}
        <div style={{ marginTop: '20px' }}>
          <h3>Add Tracked PR</h3>
          <input
            placeholder="Exercise"
            value={newExercise}
            onChange={e => setNewExercise(e.target.value)}
            style={{ marginRight: '8px' }}
          />
          <input
            type="number"
            placeholder="Reps"
            value={newReps}
            onChange={e => setNewReps(e.target.value)}
            style={{ marginRight: '8px' }}
          />
          <input
            type="number"
            placeholder="Load"
            value={newLoad}
            onChange={e => setNewLoad(e.target.value)}
            style={{ marginRight: '8px' }}
          />
          <button onClick={handleAdd}>Add</button>
        </div>
      </div>
    );
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
                      {pr.reps} rep{pr.reps !== 1 ? 's' : ''}: {pr.maxLoad} lbs{pr.estimated ? ' (estimated)' : ''}
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
      <hr style={{ margin: '40px 0' }} />
      <TrackedPRSection />
    </div>
  );
}