import React, { useEffect, useState } from 'react';

export default function DayDetail({ id, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPlan, setNewPlan] = useState({ exercise: '', reps: 0, load: 0, order_num: 1 });
  const [completionForm, setCompletionForm] = useState({ exercise: '', reps_done: 0, load_done: 0 });
  const [isCompleting, setIsCompleting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
      setError(null);
    }
    
    try {
      const response = await fetch(`/api/days/${id}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const newData = await response.json();
      
      // Only update if data has actually changed
      setData(prevData => {
        const newDataString = JSON.stringify(newData);
        const currentDataString = JSON.stringify(prevData);
        
        if (newDataString !== currentDataString) {
          setLastUpdated(new Date());
          
          // Pre-fill completion form with next set in queue
          if (newData.plan && newData.plan.length > 0) {
            const nextSet = newData.plan[0]; // First set in queue
            setCompletionForm({
              exercise: nextSet.exercise,
              reps_done: nextSet.reps,
              load_done: nextSet.load
            });
          }
          
          return newData;
        }
        return prevData;
      });
      
      if (showLoading) {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading day data:', err);
      setError(err.message);
      if (showLoading) {
        setLoading(false);
      }
    }
  };
  
  useEffect(() => {
    // Initial load
    load(true);
    
    // Set up polling every 3 seconds
    const interval = setInterval(() => load(false), 3000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div><button onClick={onBack}>Back</button><p>Loading day details...</p></div>;
  if (error) return <div><button onClick={onBack}>Back</button><p>Error loading day: {error}</p></div>;
  if (!data) return <div><button onClick={onBack}>Back</button><p>No data found for this day.</p></div>;

  const addPlan = async () => {
    await fetch(`/api/days/${id}/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPlan) });
    setNewPlan({ exercise: '', reps: 0, load: 0, order_num: 1 });
    load(false); // Don't show loading spinner for user-initiated actions
  };

  const completeSet = async () => {
    if (data.plan.length === 0) return;
    
    setIsCompleting(true);
    try {
      // Add to completed sets
      await fetch(`/api/days/${id}/completed`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(completionForm) 
      });
      
      // Remove the first planned set (next in queue)
      const nextSetId = data.plan[0].id;
      await fetch(`/api/plan/${nextSetId}`, { method: 'DELETE' });
      
      // Refresh data
      load(false);
    } catch (err) {
      console.error('Error completing set:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCompletionFormSubmit = (e) => {
    e.preventDefault();
    completeSet();
  };

  const updateSummary = async () => {
    await fetch(`/api/days/${id}/summary`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary: data.log.summary }) });
  };

  const updatePlan = async (p) => {
    await fetch(`/api/plan/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
  };
  const deletePlan = async (pid) => { await fetch(`/api/plan/${pid}`, { method: 'DELETE' }); load(false); };
  const deleteComp = async (cid) => { await fetch(`/api/completed/${cid}`, { method: 'DELETE' }); load(false); };

  const handlePlanChange = (idx, field, value) => {
    const upd = { ...data.plan[idx], [field]: value };
    const copy = [...data.plan];
    copy[idx] = upd;
    setData({ ...data, plan: copy });
    updatePlan(upd);
  };

  const handleCompletionChange = (field, value) => {
    setCompletionForm(prev => ({ ...prev, [field]: value }));
  };

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

  const workoutSectionStyle = {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px'
  };

  const queueSectionStyle = {
    flex: 1,
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden'
  };

  const completedSectionStyle = {
    flex: 1,
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden'
  };

  const completionSectionStyle = {
    border: '1px solid #28a745',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    backgroundColor: '#f8fff8'
  };

  const nextSetStyle = {
    backgroundColor: '#e8f5e8',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '15px',
    border: '2px solid #28a745'
  };

  const completionFormStyle = {
    display: 'flex',
    gap: '10px',
    alignItems: 'end',
    flexWrap: 'wrap'
  };

  const formGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  };

  const tableHeaderStyle = {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    margin: 0,
    borderBottom: '1px solid #ddd',
    fontSize: '16px',
    fontWeight: 'bold'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  };

  const thStyle = {
    backgroundColor: '#f8f9fa',
    padding: '8px',
    textAlign: 'left',
    borderBottom: '1px solid #ddd',
    fontSize: '12px',
    fontWeight: 'bold'
  };

  const tdStyle = {
    padding: '4px',
    borderBottom: '1px solid #eee'
  };

  const inputStyle = {
    width: '100%',
    padding: '4px',
    border: '1px solid #ccc',
    borderRadius: '3px',
    fontSize: '14px'
  };

  const numberInputStyle = {
    ...inputStyle,
    width: '60px',
    textAlign: 'center'
  };

  const orderInputStyle = {
    ...inputStyle,
    width: '40px',
    textAlign: 'center'
  };

  const buttonStyle = {
    padding: '4px 8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px'
  };

  const addButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#28a745'
  };

  const completeButtonStyle = {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  };

  const summaryStyle = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px'
  };

  const textareaStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'Arial, sans-serif',
    resize: 'vertical'
  };

  const nextSet = data.plan.length > 0 ? data.plan[0] : null;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Workout Day: {data.log.log_date}</h2>
          {lastUpdated && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        <button style={backButtonStyle} onClick={onBack}>← Back</button>
      </div>
      
      {/* Complete Set Section */}
      <div style={completionSectionStyle}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>🎯 Complete Set</h3>
        
        {nextSet ? (
          <div style={nextSetStyle}>
            <h4 style={{ margin: '0 0 8px 0', color: '#155724' }}>Next in Queue:</h4>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
              {nextSet.exercise} - {nextSet.reps} reps @ {nextSet.load} lbs
            </p>
          </div>
        ) : (
          <div style={{ ...nextSetStyle, backgroundColor: '#f8f9fa', borderColor: '#6c757d' }}>
            <p style={{ margin: 0, color: '#6c757d' }}>🎉 All sets completed!</p>
          </div>
        )}

        {nextSet && (
          <form onSubmit={handleCompletionFormSubmit} style={completionFormStyle}>
            <div style={formGroupStyle}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Exercise</label>
              <input
                style={{ ...inputStyle, width: '150px' }}
                value={completionForm.exercise}
                onChange={e => handleCompletionChange('exercise', e.target.value)}
                placeholder="Exercise name"
              />
            </div>
            <div style={formGroupStyle}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Reps Done</label>
              <input
                style={numberInputStyle}
                type="number"
                value={completionForm.reps_done}
                onChange={e => handleCompletionChange('reps_done', parseInt(e.target.value) || 0)}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Weight (lbs)</label>
              <input
                style={numberInputStyle}
                type="number"
                value={completionForm.load_done}
                onChange={e => handleCompletionChange('load_done', parseFloat(e.target.value) || 0)}
              />
            </div>
            <button
              type="submit"
              style={completeButtonStyle}
              disabled={isCompleting}
            >
              {isCompleting ? 'Completing...' : '✓ Complete Set'}
            </button>
          </form>
        )}
      </div>

      <div style={workoutSectionStyle}>
        {/* Set Queue */}
        <div style={queueSectionStyle}>
          <h3 style={tableHeaderStyle}>📋 Set Queue ({data.plan.length} remaining)</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Exercise</th>
                <th style={thStyle}>Reps</th>
                <th style={thStyle}>Load</th>
                <th style={thStyle}>Order</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.plan.map((p, i) => (
                <tr key={p.id} style={i === 0 ? { backgroundColor: '#e8f5e8' } : {}}>
                  <td style={tdStyle}>
                    <input 
                      style={inputStyle}
                      value={p.exercise} 
                      onChange={e => handlePlanChange(i,'exercise', e.target.value)} 
                    />
                  </td>
                  <td style={tdStyle}>
                    <input 
                      style={numberInputStyle}
                      type="number" 
                      value={p.reps} 
                      onChange={e => handlePlanChange(i,'reps', e.target.value)} 
                    />
                  </td>
                  <td style={tdStyle}>
                    <input 
                      style={numberInputStyle}
                      type="number" 
                      value={p.load} 
                      onChange={e => handlePlanChange(i,'load', e.target.value)} 
                    />
                  </td>
                  <td style={tdStyle}>
                    <input 
                      style={orderInputStyle}
                      type="number" 
                      value={p.order_num} 
                      onChange={e => handlePlanChange(i,'order_num', e.target.value)} 
                    />
                  </td>
                  <td style={tdStyle}>
                    <button 
                      style={buttonStyle}
                      onClick={() => {deletePlan(p.id);}}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <td style={tdStyle}>
                  <input 
                    style={inputStyle}
                    value={newPlan.exercise} 
                    onChange={e => setNewPlan({...newPlan, exercise:e.target.value})} 
                    placeholder="Exercise name"
                  />
                </td>
                <td style={tdStyle}>
                  <input 
                    style={numberInputStyle}
                    type="number" 
                    value={newPlan.reps} 
                    onChange={e => setNewPlan({...newPlan, reps:e.target.value})} 
                  />
                </td>
                <td style={tdStyle}>
                  <input 
                    style={numberInputStyle}
                    type="number" 
                    value={newPlan.load} 
                    onChange={e => setNewPlan({...newPlan, load:e.target.value})} 
                  />
                </td>
                <td style={tdStyle}>
                  <input 
                    style={orderInputStyle}
                    type="number" 
                    value={newPlan.order_num} 
                    onChange={e => setNewPlan({...newPlan, order_num:e.target.value})} 
                  />
                </td>
                <td style={tdStyle}>
                  <button 
                    style={addButtonStyle}
                    onClick={addPlan}
                  >
                    Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Completed Sets Log */}
        <div style={completedSectionStyle}>
          <h3 style={tableHeaderStyle}>✅ Completed Sets ({data.completed.length} done)</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Exercise</th>
                <th style={thStyle}>Reps</th>
                <th style={thStyle}>Load</th>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.completed.map((c) => (
                <tr key={c.id}>
                  <td style={tdStyle}>
                    <strong>{c.exercise}</strong>
                  </td>
                  <td style={tdStyle}>
                    <strong>{c.reps_done}</strong>
                  </td>
                  <td style={tdStyle}>
                    <strong>{c.load_done}</strong>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {(() => {
                        const date = new Date(c.completed_at);
                        // Convert UTC timestamp to Eastern Time
                        const options = { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'America/New_York'
                        };
                        return date.toLocaleTimeString('en-US', options);
                      })()}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button 
                      style={buttonStyle}
                      onClick={() => {deleteComp(c.id);}}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {data.completed.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ ...tdStyle, textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                    No sets completed yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={summaryStyle}>
        <h3 style={{ marginTop: 0, marginBottom: '10px' }}>📝 Workout Summary</h3>
        <textarea 
          style={textareaStyle}
          rows="4"
          placeholder="Add your workout summary here..."
          value={data.log.summary || ''} 
          onChange={e => setData({ ...data, log: { ...data.log, summary: e.target.value } })} 
          onBlur={updateSummary} 
        />
      </div>
    </div>
  );
}
