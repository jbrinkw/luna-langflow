const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'workout.db'));

function initDb(sample = false) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    );
    CREATE TABLE IF NOT EXISTS daily_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_date TEXT UNIQUE,
      summary TEXT
    );
    CREATE TABLE IF NOT EXISTS planned_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id INTEGER,
      exercise_id INTEGER,
      order_num INTEGER,
      reps INTEGER,
      load REAL,
      FOREIGN KEY(log_id) REFERENCES daily_logs(id) ON DELETE CASCADE,
      FOREIGN KEY(exercise_id) REFERENCES exercises(id)
    );
    CREATE TABLE IF NOT EXISTS completed_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id INTEGER,
      exercise_id INTEGER,
      reps_done INTEGER,
      load_done REAL,
      FOREIGN KEY(log_id) REFERENCES daily_logs(id) ON DELETE CASCADE,
      FOREIGN KEY(exercise_id) REFERENCES exercises(id)
    );
  `);

  if (sample) {
    const today = new Date().toISOString().slice(0,10);
    const logId = ensureDay(today);
    const exId = getExerciseId('bench press');
    db.prepare('INSERT OR IGNORE INTO planned_sets (log_id, exercise_id, order_num, reps, load) VALUES (?, ?, ?, ?, ?)')
      .run(logId, exId, 1, 10, 100);
  }
}

function getExerciseId(name) {
  const row = db.prepare('SELECT id FROM exercises WHERE name=?').get(name);
  if (row) return row.id;
  const info = db.prepare('INSERT INTO exercises (name) VALUES (?)').run(name);
  return info.lastInsertRowid;
}

function ensureDay(dateStr) {
  const row = db.prepare('SELECT id FROM daily_logs WHERE log_date=?').get(dateStr);
  if (row) return row.id;
  const info = db.prepare("INSERT INTO daily_logs (log_date, summary) VALUES (?, '')").run(dateStr);
  return info.lastInsertRowid;
}

function getAllDays() {
  return db.prepare('SELECT id, log_date, summary FROM daily_logs ORDER BY log_date DESC').all();
}

function deleteDay(id) {
  db.prepare('DELETE FROM daily_logs WHERE id=?').run(id);
}

function getDay(id) {
  const log = db.prepare('SELECT id, log_date, summary FROM daily_logs WHERE id=?').get(id);
  if (!log) return null;
  const plan = db.prepare(`SELECT ps.id, e.name as exercise, ps.reps, ps.load, ps.order_num
                           FROM planned_sets ps JOIN exercises e ON ps.exercise_id=e.id
                           WHERE ps.log_id=? ORDER BY ps.order_num`).all(id);
  const completed = db.prepare(`SELECT cs.id, e.name as exercise, cs.reps_done, cs.load_done
                                FROM completed_sets cs JOIN exercises e ON cs.exercise_id=e.id
                                WHERE cs.log_id=?`).all(id);
  return { log, plan, completed };
}

function addPlan(logId, item) {
  const exId = getExerciseId(item.exercise);
  const info = db.prepare('INSERT INTO planned_sets (log_id, exercise_id, order_num, reps, load) VALUES (?, ?, ?, ?, ?)')
    .run(logId, exId, item.order_num, item.reps, item.load);
  return info.lastInsertRowid;
}

function updatePlan(id, item) {
  const exId = getExerciseId(item.exercise);
  db.prepare('UPDATE planned_sets SET exercise_id=?, order_num=?, reps=?, load=? WHERE id=?')
    .run(exId, item.order_num, item.reps, item.load, id);
}

function deletePlan(id) {
  db.prepare('DELETE FROM planned_sets WHERE id=?').run(id);
}

function addCompleted(logId, item) {
  const exId = getExerciseId(item.exercise);
  const info = db.prepare('INSERT INTO completed_sets (log_id, exercise_id, reps_done, load_done) VALUES (?, ?, ?, ?)')
    .run(logId, exId, item.reps_done, item.load_done);
  return info.lastInsertRowid;
}

function updateCompleted(id, item) {
  const exId = getExerciseId(item.exercise);
  db.prepare('UPDATE completed_sets SET exercise_id=?, reps_done=?, load_done=? WHERE id=?')
    .run(exId, item.reps_done, item.load_done, id);
}

function deleteCompleted(id) {
  db.prepare('DELETE FROM completed_sets WHERE id=?').run(id);
}

function updateSummary(id, summary) {
  db.prepare('UPDATE daily_logs SET summary=? WHERE id=?').run(summary, id);
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
};
