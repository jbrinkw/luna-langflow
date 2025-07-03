import React, { useEffect, useState } from 'react';
import DayDetail from './DayDetail';

export default function App() {
  const [days, setDays] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/days')
      .then(r => r.json())
      .then(data => {
        setDays(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading days:', err);
        setLoading(false);
      });
  }, []);

  const refreshDays = () => {
    setLoading(true);
    fetch('/api/days')
      .then(r => r.json())
      .then(data => {
        setDays(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading days:', err);
        setLoading(false);
      });
  };

  const deleteDay = async (id) => {
    await fetch(`/api/days/${id}`, { method: 'DELETE' });
    setDays(days.filter(d => d.id !== id));
    if (selected === id) setSelected(null);
  };

  const handleBack = () => {
    setSelected(null);
    refreshDays(); // Refresh the list when going back
  };

  return (
    <div style={{ padding: 20 }}>
      {!selected && (
        <div>
          <h2>Workout Days</h2>
          {loading && <p>Loading workout days...</p>}
          {!loading && days.length === 0 && (
            <div>
              <p>No workout days found.</p>
              <p>Run <code>npm run load-sample</code> to load sample data.</p>
            </div>
          )}
          {!loading && days.length > 0 && (
            <table border="1" cellPadding="4">
              <thead>
                <tr><th>Date</th><th>Summary</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {days.map(d => (
                  <tr key={d.id}>
                    <td>{d.log_date}</td>
                    <td>{d.summary || <em>No summary</em>}</td>
                    <td>
                      <button onClick={() => setSelected(d.id)}>View</button>
                      <button onClick={() => deleteDay(d.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {selected && <DayDetail id={selected} onBack={handleBack} />}
    </div>
  );
}
