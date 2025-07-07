const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static('.'));

// Database is initialized via Python scripts
// db.initDb(false);

app.get('/api/days', async (req, res) => {
  try {
    const days = await db.getAllDays();
    res.json(days);
  } catch (error) {
    console.error('Error getting days:', error);
    res.status(500).json({ error: 'Failed to get days' });
  }
});

app.post('/api/days', async (req, res) => {
  try {
    const { date } = req.body;
    const id = await db.ensureDay(date);
    res.json({ id });
  } catch (error) {
    console.error('Error creating day:', error);
    res.status(500).json({ error: 'Failed to create day' });
  }
});

app.delete('/api/days/:id', async (req, res) => {
  try {
    await db.deleteDay(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting day:', error);
    res.status(500).json({ error: 'Failed to delete day' });
  }
});

app.get('/api/days/:id', async (req, res) => {
  try {
    const data = await db.getDay(req.params.id);
    if (!data) return res.status(404).end();
    res.json(data);
  } catch (error) {
    console.error('Error getting day:', error);
    res.status(500).json({ error: 'Failed to get day' });
  }
});

app.post('/api/days/:id/plan', async (req, res) => {
  try {
    const id = await db.addPlan(req.params.id, req.body);
    res.json({ id });
  } catch (error) {
    console.error('Error adding plan:', error);
    res.status(500).json({ error: 'Failed to add plan' });
  }
});

app.put('/api/plan/:id', async (req, res) => {
  try {
    await db.updatePlan(Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

app.delete('/api/plan/:id', async (req, res) => {
  try {
    await db.deletePlan(Number(req.params.id));
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

app.post('/api/days/:id/completed', async (req, res) => {
  try {
    const id = await db.addCompleted(req.params.id, req.body);
    
    // Return the complete data including timestamp
    const dayData = await db.getDay(req.params.id);
    const completedSet = dayData.completed.find(c => c.id === id);
    
    if (completedSet) {
      res.json({
        id: completedSet.id,
        exercise: completedSet.exercise,
        reps_done: completedSet.reps_done,
        load_done: completedSet.load_done,
        completed_at: completedSet.completed_at
      });
    } else {
      res.json({ id });
    }
  } catch (error) {
    console.error('Error adding completed set:', error);
    res.status(500).json({ error: 'Failed to add completed set' });
  }
});

app.put('/api/completed/:id', async (req, res) => {
  try {
    await db.updateCompleted(Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating completed set:', error);
    res.status(500).json({ error: 'Failed to update completed set' });
  }
});

app.delete('/api/completed/:id', async (req, res) => {
  try {
    await db.deleteCompleted(Number(req.params.id));
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting completed set:', error);
    res.status(500).json({ error: 'Failed to delete completed set' });
  }
});

app.put('/api/days/:id/summary', async (req, res) => {
  try {
    await db.updateSummary(req.params.id, req.body.summary || '');
    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating summary:', error);
    res.status(500).json({ error: 'Failed to update summary' });
  }
});

// Serve the React app for the root route
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Server running on', PORT));
