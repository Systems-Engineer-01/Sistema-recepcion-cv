import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('./data/sire_cv.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, nombre_original FROM documentos", (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  
  let updates = 0;
  let completed = 0;

  if (rows.length === 0) {
    db.close();
    return;
  }

  rows.forEach(row => {
    let original = row.nombre_original;
    let decoded = original;
    try {
      decoded = Buffer.from(original, 'latin1').toString('utf8');
    } catch(e) {}
    
    if (decoded !== original && original.includes('Ã')) {
      updates++;
      db.run("UPDATE documentos SET nombre_original = ? WHERE id = ?", [decoded, row.id], (err) => {
        if (err) console.error("Error updating ID", row.id, err);
        else console.log(`Updated ID ${row.id}: ${decoded}`);
        checkDone();
      });
    } else {
      checkDone();
    }
  });

  function checkDone() {
    completed++;
    if (completed === rows.length) {
      console.log(`Finished checking all rows. Updated ${updates} rows.`);
      db.close();
    }
  }
});
