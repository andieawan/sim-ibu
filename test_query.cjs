const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./sekolah.db');
db.all("SELECT * FROM detail_absensi LIMIT 1", (err, rows) => {
  console.log('detail_absensi:', rows);
});
db.all("SELECT DISTINCT status FROM detail_absensi", (err, rows) => {
  console.log('status:', rows);
});
