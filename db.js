const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || '192.168.1.93',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'workout_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

const pool = new Pool(dbConfig);

async function initDb(sample = false) {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );
      CREATE TABLE IF NOT EXISTS daily_logs (
        id VARCHAR(255) PRIMARY KEY,
        log_date DATE NOT NULL UNIQUE,
        summary TEXT
      );
      CREATE TABLE IF NOT EXISTS planned_sets (
        id SERIAL PRIMARY KEY,
        log_id VARCHAR(255) REFERENCES daily_logs(id) ON DELETE CASCADE,
        exercise_id INTEGER REFERENCES exercises(id),
        order_num INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        load REAL NOT NULL
      );
      CREATE TABLE IF NOT EXISTS completed_sets (
        id SERIAL PRIMARY KEY,
        log_id VARCHAR(255) REFERENCES daily_logs(id) ON DELETE CASCADE,
        exercise_id INTEGER REFERENCES exercises(id),
        planned_set_id INTEGER REFERENCES planned_sets(id),
        reps_done INTEGER,
        load_done REAL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS tracked_prs (
        exercise VARCHAR(255) NOT NULL,
        reps INTEGER NOT NULL,
        max_load REAL NOT NULL,
        PRIMARY KEY (exercise, reps)
      );
    `);

    if (sample) {
      const today = new Date().toISOString().slice(0,10);
      const logId = await ensureDay(today);
      const exId = await getExerciseId('bench press');
      await client.query(
        'INSERT INTO planned_sets (log_id, exercise_id, order_num, reps, load) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
        [logId, exId, 1, 10, 100]
      );
    }
  } finally {
    client.release();
  }
}

async function getExerciseId(name) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id FROM exercises WHERE name = $1', [name]);
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
    const insertResult = await client.query('INSERT INTO exercises (name) VALUES ($1) RETURNING id', [name]);
    return insertResult.rows[0].id;
  } finally {
    client.release();
  }
}

async function ensureDay(dateStr) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id FROM daily_logs WHERE log_date = $1', [dateStr]);
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
    const logId = generateUuid();
    await client.query('INSERT INTO daily_logs (id, log_date, summary) VALUES ($1, $2, $3)', [logId, dateStr, '']);
    return logId;
  } finally {
    client.release();
  }
}

function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function getAllDays() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, log_date, summary FROM daily_logs ORDER BY log_date DESC');
    return result.rows;
  } finally {
    client.release();
  }
}

async function deleteDay(id) {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM daily_logs WHERE id = $1', [id]);
  } finally {
    client.release();
  }
}

async function getDay(id) {
  const client = await pool.connect();
  try {
    const logResult = await client.query('SELECT id, log_date, summary FROM daily_logs WHERE id = $1', [id]);
    if (logResult.rows.length === 0) return null;
    
    const log = logResult.rows[0];
    
      const planResult = await client.query(`
    SELECT ps.id, e.name as exercise, ps.reps, ps.load, ps.rest, ps.order_num
    FROM planned_sets ps JOIN exercises e ON ps.exercise_id = e.id
    WHERE ps.log_id = $1 ORDER BY ps.order_num
  `, [id]);
    
    const completedResult = await client.query(`
      SELECT cs.id, e.name as exercise, cs.planned_set_id, cs.reps_done, cs.load_done, cs.completed_at
      FROM completed_sets cs JOIN exercises e ON cs.exercise_id = e.id
      WHERE cs.log_id = $1
      ORDER BY cs.completed_at DESC NULLS LAST
    `, [id]);
    
    return {
      log,
      plan: planResult.rows,
      completed: completedResult.rows
    };
  } finally {
    client.release();
  }
}

async function addPlan(logId, item) {
  const client = await pool.connect();
  try {
    const exId = await getExerciseId(item.exercise);
    const rest = item.rest || 60; // Default to 60 seconds if not provided
    const result = await client.query(
      'INSERT INTO planned_sets (log_id, exercise_id, order_num, reps, load, rest) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [logId, exId, item.order_num, item.reps, item.load, rest]
    );
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

async function updatePlan(id, item) {
  const client = await pool.connect();
  try {
    const exId = await getExerciseId(item.exercise);
    const rest = item.rest || 60; // Default to 60 seconds if not provided
    await client.query(
      'UPDATE planned_sets SET exercise_id = $1, order_num = $2, reps = $3, load = $4, rest = $5 WHERE id = $6',
      [exId, item.order_num, item.reps, item.load, rest, id]
    );
  } finally {
    client.release();
  }
}

async function deletePlan(id) {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM planned_sets WHERE id = $1', [id]);
  } finally {
    client.release();
  }
}

async function addCompleted(logId, item) {
  const client = await pool.connect();
  try {
    const exId = await getExerciseId(item.exercise);
    const result = await client.query(
      'INSERT INTO completed_sets (log_id, exercise_id, planned_set_id, reps_done, load_done, completed_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id',
      [logId, exId, item.planned_set_id || null, item.reps_done, item.load_done]
    );
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

async function updateCompleted(id, item) {
  const client = await pool.connect();
  try {
    const exId = await getExerciseId(item.exercise);
    await client.query(
      'UPDATE completed_sets SET exercise_id = $1, planned_set_id = $2, reps_done = $3, load_done = $4 WHERE id = $5',
      [exId, item.planned_set_id || null, item.reps_done, item.load_done, id]
    );
  } finally {
    client.release();
  }
}

async function deleteCompleted(id) {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM completed_sets WHERE id = $1', [id]);
  } finally {
    client.release();
  }
}

async function updateSummary(id, summary) {
  const client = await pool.connect();
  try {
    await client.query('UPDATE daily_logs SET summary = $1 WHERE id = $2', [summary, id]);
  } finally {
    client.release();
  }
}

async function getPRs() {
  const client = await pool.connect();
  try {
    // Hardcoded tracked exercises for now (match database capitalization)
    const trackedExercises = ['Bench Press', 'Squat', 'Deadlift'];
    
    const result = await client.query(`
      SELECT 
        e.name as exercise,
        cs.reps_done,
        MAX(cs.load_done) as max_load
      FROM completed_sets cs
      JOIN exercises e ON cs.exercise_id = e.id
      WHERE e.name = ANY($1)
        AND cs.reps_done > 0
        AND cs.load_done > 0
      GROUP BY e.name, cs.reps_done
      ORDER BY e.name, cs.reps_done
    `, [trackedExercises]);
    
    // Group by exercise
    const prsByExercise = {};
    for (const row of result.rows) {
      if (!prsByExercise[row.exercise]) {
        prsByExercise[row.exercise] = [];
      }
      prsByExercise[row.exercise].push({
        reps: row.reps_done,
        maxLoad: row.max_load
      });
    }
    
    return prsByExercise;
  } finally {
    client.release();
  }
}

async function getTrackedPRs() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT exercise, reps, max_load FROM tracked_prs ORDER BY exercise, reps'
    );
    const prsByExercise = {};
    for (const row of result.rows) {
      if (!prsByExercise[row.exercise]) {
        prsByExercise[row.exercise] = [];
      }
      prsByExercise[row.exercise].push({
        reps: row.reps,
        maxLoad: row.max_load,
      });
    }
    return prsByExercise;
  } finally {
    client.release();
  }
}

async function upsertTrackedPR(exercise, reps, maxLoad) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO tracked_prs (exercise, reps, max_load)
       VALUES ($1, $2, $3)
       ON CONFLICT (exercise, reps)
       DO UPDATE SET max_load = EXCLUDED.max_load`,
      [exercise, reps, maxLoad]
    );
  } finally {
    client.release();
  }
}

async function deleteTrackedPR(exercise, reps) {
  const client = await pool.connect();
  try {
    await client.query(
      'DELETE FROM tracked_prs WHERE exercise = $1 AND reps = $2',
      [exercise, reps]
    );
  } finally {
    client.release();
  }
}

module.exports = {
  initDb,
  ensureDay,
  getAllDays,
  getDay,
  addPlan,
  updatePlan,
  deletePlan,
  addCompleted,
  updateCompleted,
  deleteCompleted,
  updateSummary,
  deleteDay,
  getPRs,
  getTrackedPRs,
  upsertTrackedPR,
  deleteTrackedPR,
};
