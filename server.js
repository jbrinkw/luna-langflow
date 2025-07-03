const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

db.initDb(true);

app.get('/api/days', (req, res) => {
  res.json(db.getAllDays());
});

app.post('/api/days', (req, res) => {
  const { date } = req.body;
  const id = db.ensureDay(date);
  res.json({ id });
});

app.delete('/api/days/:id', (req, res) => {
  db.deleteDay(Number(req.params.id));
  res.json({ ok: true });
});

app.get('/api/days/:id', (req, res) => {
  const data = db.getDay(Number(req.params.id));
  if (!data) return res.status(404).end();
  res.json(data);
});

app.post('/api/days/:id/plan', (req, res) => {
  const id = db.addPlan(Number(req.params.id), req.body);
  res.json({ id });
});

app.put('/api/plan/:id', (req, res) => {
  db.updatePlan(Number(req.params.id), req.body);
  res.json({ ok: true });
});

app.delete('/api/plan/:id', (req, res) => {
  db.deletePlan(Number(req.params.id));
  res.json({ ok: true });
});

app.post('/api/days/:id/completed', (req, res) => {
  const id = db.addCompleted(Number(req.params.id), req.body);
  res.json({ id });
});

app.put('/api/completed/:id', (req, res) => {
  db.updateCompleted(Number(req.params.id), req.body);
  res.json({ ok: true });
});

app.delete('/api/completed/:id', (req, res) => {
  db.deleteCompleted(Number(req.params.id));
  res.json({ ok: true });
});

app.put('/api/days/:id/summary', (req, res) => {
  db.updateSummary(Number(req.params.id), req.body.summary || '');
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Server running on', PORT));
