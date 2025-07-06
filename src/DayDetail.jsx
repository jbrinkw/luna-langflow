import React, { useEffect, useState } from 'react';

export default function DayDetail({ id, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPlan, setNewPlan] = useState({ exercise: '', reps: 0, load: 0, order_num: 1 });
  const [newComp, setNewComp] = useState({ exercise: '', reps_done: 0, load_done: 0 });

  const load = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/days/${id}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading day data:', err);
        setError(err.message);
        setLoading(false);
      });
  };
  
  useEffect(load, [id]);

  if (loading) return <div><button onClick={onBack}>Back</button><p>Loading day details...</p></div>;
  if (error) return <div><button onClick={onBack}>Back</button><p>Error loading day: {error}</p></div>;
  if (!data) return <div><button onClick={onBack}>Back</button><p>No data found for this day.</p></div>;

  const addPlan = async () => {
    await fetch(`/api/days/${id}/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPlan) });
    setNewPlan({ exercise: '', reps: 0, load: 0, order_num: 1 });
    load();
  };
  const addCompleted = async () => {
    await fetch(`/api/days/${id}/completed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newComp) });
    setNewComp({ exercise: '', reps_done: 0, load_done: 0 });
    load();
  };
  const updateSummary = async () => {
    await fetch(`/api/days/${id}/summary`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary: data.log.summary }) });
  };

  const updatePlan = async (p) => {
    await fetch(`/api/plan/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
  };
  const deletePlan = async (pid) => { await fetch(`/api/plan/${pid}`, { method: 'DELETE' }); load(); };
  const updateComp = async (c) => { await fetch(`/api/completed/${c.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) }); };
  const deleteComp = async (cid) => { await fetch(`/api/completed/${cid}`, { method: 'DELETE' }); load(); };

  const handlePlanChange = (idx, field, value) => {
    const upd = { ...data.plan[idx], [field]: value };
    const copy = [...data.plan];
    copy[idx] = upd;
    setData({ ...data, plan: copy });
    updatePlan(upd);
  };
  const handleCompChange = (idx, field, value) => {
    const upd = { ...data.completed[idx], [field]: value };
    const copy = [...data.completed];
    copy[idx] = upd;
    setData({ ...data, completed: copy });
    updateComp(upd);
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

  const tablesContainerStyle = {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px'
  };

  const tableWrapperStyle = {
    flex: 1,
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden'
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

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>Workout Day: {data.log.log_date}</h2>
        <button style={backButtonStyle} onClick={onBack}>← Back</button>
      </div>
      
      <div style={tablesContainerStyle}>
        {/* Planned Sets */}
        <div style={tableWrapperStyle}>
          <h3 style={tableHeaderStyle}>📋 Planned Sets</h3>
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
                <tr key={p.id}>
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
                      Delete
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

        {/* Completed Sets */}
        <div style={tableWrapperStyle}>
          <h3 style={tableHeaderStyle}>✅ Completed Sets</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Exercise</th>
                <th style={thStyle}>Reps</th>
                <th style={thStyle}>Load</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.completed.map((c,i) => (
                <tr key={c.id}>
                  <td style={tdStyle}>
                    <input 
                      style={inputStyle}
                      value={c.exercise} 
                      onChange={e => handleCompChange(i,'exercise', e.target.value)} 
                    />
                  </td>
                  <td style={tdStyle}>
                    <input 
                      style={numberInputStyle}
                      type="number" 
                      value={c.reps_done} 
                      onChange={e => handleCompChange(i,'reps_done', e.target.value)} 
                    />
                  </td>
                  <td style={tdStyle}>
                    <input 
                      style={numberInputStyle}
                      type="number" 
                      value={c.load_done} 
                      onChange={e => handleCompChange(i,'load_done', e.target.value)} 
                    />
                  </td>
                  <td style={tdStyle}>
                    <button 
                      style={buttonStyle}
                      onClick={() => {deleteComp(c.id);}}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <td style={tdStyle}>
                  <input 
                    style={inputStyle}
                    value={newComp.exercise} 
                    onChange={e => setNewComp({...newComp, exercise:e.target.value})} 
                    placeholder="Exercise name"
                  />
                </td>
                <td style={tdStyle}>
                  <input 
                    style={numberInputStyle}
                    type="number" 
                    value={newComp.reps_done} 
                    onChange={e => setNewComp({...newComp, reps_done:e.target.value})} 
                  />
                </td>
                <td style={tdStyle}>
                  <input 
                    style={numberInputStyle}
                    type="number" 
                    value={newComp.load_done} 
                    onChange={e => setNewComp({...newComp, load_done:e.target.value})} 
                  />
                </td>
                <td style={tdStyle}>
                  <button 
                    style={addButtonStyle}
                    onClick={addCompleted}
                  >
                    Add
                  </button>
                </td>
              </tr>
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
