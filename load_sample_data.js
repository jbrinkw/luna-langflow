const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database setup
const dbPath = path.join(__dirname, 'workout.db');
const db = new Database(dbPath);

function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function loadSampleData() {
  console.log('Loading comprehensive 3-day MMA workout sample data with dynamic dates...');
  
  // Create schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY,
      log_date DATE NOT NULL UNIQUE,
      summary TEXT
    );
    CREATE TABLE IF NOT EXISTS planned_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id TEXT REFERENCES daily_logs(id) ON DELETE CASCADE,
      exercise_id INTEGER REFERENCES exercises(id),
      order_num INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      load REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS completed_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id TEXT REFERENCES daily_logs(id) ON DELETE CASCADE,
      exercise_id INTEGER REFERENCES exercises(id),
      reps_done INTEGER,
      load_done REAL,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Clear existing data
  db.exec(`
    DELETE FROM completed_sets;
    DELETE FROM planned_sets;
    DELETE FROM exercises;
    DELETE FROM daily_logs;
  `);

  // Create logs for 3 days: current day, current day - 1, current day - 2
  const today = new Date();
  const dates = [];
  const logIds = [];
  const summaries = [
    'Great workout 2 days ago! Hit all my targets.',
    'Good session yesterday. Made progress on all lifts.',
    ''  // Today - no summary yet
  ];
  
  // Create logs for 3 days
  for (let i = 2; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    dates.push(dateStr);
    
    const logId = generateUuid();
    logIds.push(logId);
    
    db.prepare("INSERT INTO daily_logs (id, log_date, summary) VALUES (?, ?, ?)")
      .run(logId, dateStr, summaries[2-i]);
    console.log(`Created daily log for ${dateStr}`);
  }

  // Add exercises
  const exercises = [
    { name: 'push-ups' },
    { name: 'pull-ups' }, 
    { name: 'bench press' },
    { name: 'overhead press' },
    { name: 'rows' },
    { name: 'dips' },
    { name: 'squats' },
    { name: 'deadlifts' },
    { name: 'bodyweight squats' },
    { name: 'walking lunges' },
    { name: 'calf raises' },
    { name: 'plank' },
    { name: 'burpees' },
    { name: 'mountain climbers' }
  ];

  const exerciseIds = {};
  exercises.forEach(exercise => {
    const result = db.prepare('INSERT INTO exercises (name) VALUES (?)').run(exercise.name);
    exerciseIds[exercise.name] = result.lastInsertRowid;
    console.log(`Added exercise: ${exercise.name} (ID: ${result.lastInsertRowid})`);
  });

  // Add planned sets for each day
  const plannedSetsData = [
    // Day 1 (2 days ago) - Upper Body Focus
    [
      { exercise: 'push-ups', order_num: 1, reps: 15, load: 0 },
      { exercise: 'push-ups', order_num: 2, reps: 15, load: 0 },
      { exercise: 'push-ups', order_num: 3, reps: 15, load: 0 },
      { exercise: 'pull-ups', order_num: 4, reps: 8, load: 0 },
      { exercise: 'pull-ups', order_num: 5, reps: 8, load: 0 },
      { exercise: 'pull-ups', order_num: 6, reps: 8, load: 0 },
      { exercise: 'bench press', order_num: 7, reps: 10, load: 135 },
      { exercise: 'bench press', order_num: 8, reps: 10, load: 135 },
      { exercise: 'bench press', order_num: 9, reps: 10, load: 135 },
      { exercise: 'overhead press', order_num: 10, reps: 8, load: 95 },
      { exercise: 'overhead press', order_num: 11, reps: 8, load: 95 },
      { exercise: 'overhead press', order_num: 12, reps: 8, load: 95 },
      { exercise: 'rows', order_num: 13, reps: 12, load: 115 },
      { exercise: 'rows', order_num: 14, reps: 12, load: 115 },
      { exercise: 'rows', order_num: 15, reps: 12, load: 115 },
      { exercise: 'dips', order_num: 16, reps: 12, load: 0 },
      { exercise: 'dips', order_num: 17, reps: 12, load: 0 }
    ],
    // Day 2 (yesterday) - Lower Body Focus
    [
      { exercise: 'squats', order_num: 1, reps: 12, load: 185 },
      { exercise: 'squats', order_num: 2, reps: 12, load: 185 },
      { exercise: 'squats', order_num: 3, reps: 12, load: 185 },
      { exercise: 'squats', order_num: 4, reps: 12, load: 185 },
      { exercise: 'deadlifts', order_num: 5, reps: 8, load: 225 },
      { exercise: 'deadlifts', order_num: 6, reps: 8, load: 225 },
      { exercise: 'deadlifts', order_num: 7, reps: 8, load: 225 },
      { exercise: 'bodyweight squats', order_num: 8, reps: 20, load: 0 },
      { exercise: 'bodyweight squats', order_num: 9, reps: 20, load: 0 },
      { exercise: 'walking lunges', order_num: 10, reps: 16, load: 0 },
      { exercise: 'walking lunges', order_num: 11, reps: 16, load: 0 },
      { exercise: 'walking lunges', order_num: 12, reps: 16, load: 0 },
      { exercise: 'calf raises', order_num: 13, reps: 15, load: 45 },
      { exercise: 'calf raises', order_num: 14, reps: 15, load: 45 },
      { exercise: 'calf raises', order_num: 15, reps: 15, load: 45 },
      { exercise: 'plank', order_num: 16, reps: 45, load: 0 },
      { exercise: 'plank', order_num: 17, reps: 45, load: 0 },
      { exercise: 'plank', order_num: 18, reps: 45, load: 0 }
    ],
    // Day 3 (today) - Full Body/Conditioning
    [
      { exercise: 'burpees', order_num: 1, reps: 10, load: 0 },
      { exercise: 'burpees', order_num: 2, reps: 10, load: 0 },
      { exercise: 'burpees', order_num: 3, reps: 10, load: 0 },
      { exercise: 'burpees', order_num: 4, reps: 10, load: 0 },
      { exercise: 'push-ups', order_num: 5, reps: 12, load: 0 },
      { exercise: 'push-ups', order_num: 6, reps: 12, load: 0 },
      { exercise: 'push-ups', order_num: 7, reps: 12, load: 0 },
      { exercise: 'pull-ups', order_num: 8, reps: 6, load: 0 },
      { exercise: 'pull-ups', order_num: 9, reps: 6, load: 0 },
      { exercise: 'pull-ups', order_num: 10, reps: 6, load: 0 },
      { exercise: 'bodyweight squats', order_num: 11, reps: 15, load: 0 },
      { exercise: 'bodyweight squats', order_num: 12, reps: 15, load: 0 },
      { exercise: 'bodyweight squats', order_num: 13, reps: 15, load: 0 },
      { exercise: 'mountain climbers', order_num: 14, reps: 20, load: 0 },
      { exercise: 'mountain climbers', order_num: 15, reps: 20, load: 0 },
      { exercise: 'mountain climbers', order_num: 16, reps: 20, load: 0 },
      { exercise: 'plank', order_num: 17, reps: 60, load: 0 },
      { exercise: 'plank', order_num: 18, reps: 60, load: 0 },
      { exercise: 'plank', order_num: 19, reps: 60, load: 0 }
    ]
  ];

  // Add completed sets for each day
  const completedSetsData = [
    // Day 1 (2 days ago) - All completed
    [
      { exercise: 'push-ups', reps_done: 15, load_done: 0 },
      { exercise: 'push-ups', reps_done: 15, load_done: 0 },
      { exercise: 'push-ups', reps_done: 15, load_done: 0 },
      { exercise: 'pull-ups', reps_done: 8, load_done: 0 },
      { exercise: 'pull-ups', reps_done: 8, load_done: 0 },
      { exercise: 'pull-ups', reps_done: 8, load_done: 0 },
      { exercise: 'bench press', reps_done: 10, load_done: 135 },
      { exercise: 'bench press', reps_done: 10, load_done: 135 },
      { exercise: 'bench press', reps_done: 10, load_done: 135 },
      { exercise: 'overhead press', reps_done: 8, load_done: 95 },
      { exercise: 'overhead press', reps_done: 8, load_done: 95 },
      { exercise: 'overhead press', reps_done: 8, load_done: 95 },
      { exercise: 'rows', reps_done: 12, load_done: 115 },
      { exercise: 'rows', reps_done: 12, load_done: 115 },
      { exercise: 'rows', reps_done: 12, load_done: 115 },
      { exercise: 'dips', reps_done: 12, load_done: 0 },
      { exercise: 'dips', reps_done: 12, load_done: 0 }
    ],
    // Day 2 (yesterday) - Most completed
    [
      { exercise: 'squats', reps_done: 12, load_done: 185 },
      { exercise: 'squats', reps_done: 12, load_done: 185 },
      { exercise: 'squats', reps_done: 12, load_done: 185 },
      { exercise: 'squats', reps_done: 12, load_done: 185 },
      { exercise: 'deadlifts', reps_done: 8, load_done: 225 },
      { exercise: 'deadlifts', reps_done: 8, load_done: 225 },
      // Third deadlift set skipped
      { exercise: 'bodyweight squats', reps_done: 20, load_done: 0 },
      { exercise: 'bodyweight squats', reps_done: 20, load_done: 0 },
      { exercise: 'walking lunges', reps_done: 16, load_done: 0 },
      { exercise: 'walking lunges', reps_done: 16, load_done: 0 },
      { exercise: 'walking lunges', reps_done: 16, load_done: 0 },
      { exercise: 'calf raises', reps_done: 15, load_done: 45 },
      { exercise: 'calf raises', reps_done: 15, load_done: 45 },
      { exercise: 'calf raises', reps_done: 15, load_done: 45 },
      { exercise: 'plank', reps_done: 45, load_done: 0 },
      { exercise: 'plank', reps_done: 45, load_done: 0 },
      { exercise: 'plank', reps_done: 45, load_done: 0 }
    ],
    // Day 3 (today) - Partially completed
    [
      { exercise: 'burpees', reps_done: 10, load_done: 0 },
      { exercise: 'burpees', reps_done: 10, load_done: 0 },
      { exercise: 'push-ups', reps_done: 12, load_done: 0 },
      { exercise: 'pull-ups', reps_done: 6, load_done: 0 },
      { exercise: 'bodyweight squats', reps_done: 15, load_done: 0 },
      { exercise: 'mountain climbers', reps_done: 20, load_done: 0 },
      { exercise: 'plank', reps_done: 60, load_done: 0 }
    ]
  ];

  // Insert planned sets for all days
  let totalPlanned = 0;
  for (let i = 0; i < 3; i++) {
    plannedSetsData[i].forEach(set => {
      const exerciseId = exerciseIds[set.exercise];
      db.prepare('INSERT INTO planned_sets (log_id, exercise_id, order_num, reps, load) VALUES (?, ?, ?, ?, ?)')
        .run(logIds[i], exerciseId, set.order_num, set.reps, set.load);
      totalPlanned++;
    });
    console.log(`Added ${plannedSetsData[i].length} planned sets for ${dates[i]}`);
  }

  // Insert completed sets for all days
  let totalCompleted = 0;
  for (let i = 0; i < 3; i++) {
    completedSetsData[i].forEach(set => {
      const exerciseId = exerciseIds[set.exercise];
      db.prepare('INSERT INTO completed_sets (log_id, exercise_id, reps_done, load_done) VALUES (?, ?, ?, ?)')
        .run(logIds[i], exerciseId, set.reps_done, set.load_done);
      totalCompleted++;
    });
    console.log(`Added ${completedSetsData[i].length} completed sets for ${dates[i]}`);
  }

  console.log('Sample data loaded successfully!');
  console.log('Database contains:');
  console.log(`- ${exercises.length} exercises`);
  console.log(`- ${totalPlanned} planned sets across 3 workouts`);
  console.log(`- ${totalCompleted} completed sets`);
  console.log(`- 3 daily logs (${dates[0]}, ${dates[1]}, ${dates[2]})`);
  console.log(`- Day 1 (${dates[0]}): Upper body focus - 17 planned, 17 completed`);
  console.log(`- Day 2 (${dates[1]}): Lower body focus - 18 planned, 17 completed`);
  console.log(`- Day 3 (${dates[2]}): Full body conditioning - 19 planned, 7 completed`);
}

// Run the script
if (require.main === module) {
  try {
    loadSampleData();
  } catch (error) {
    console.error('Error loading sample data:', error);
  } finally {
    db.close();
  }
}

module.exports = { loadSampleData }; 