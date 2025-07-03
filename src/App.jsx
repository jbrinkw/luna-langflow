import React, { useEffect, useState } from 'react';
import DayDetail from './DayDetail';

export default function App() {
  const [days, setDays] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch('/api/days').then(r => r.json()).then(setDays);
  }, []);

  const deleteDay = async (id) => {
    await fetch(`/api/days/${id}`, { method: 'DELETE' });
    setDays(days.filter(d => d.id !== id));
    if (selected === id) setSelected(null);
  };

  return (
    <div style={{ padding: 20 }}>
      {!selected && (
        <table border="1" cellPadding="4">
          <thead>
            <tr><th>Date</th><th>Summary</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {days.map(d => (
              <tr key={d.id}>
                <td>{d.log_date}</td>
                <td>{d.summary}</td>
                <td>
                  <button onClick={() => setSelected(d.id)}>View</button>
                  <button onClick={() => deleteDay(d.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selected && <DayDetail id={selected} onBack={() => setSelected(null)} />}
    </div>
  );
}
