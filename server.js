// const sqlite3 = require('sqlite3').verbose();
// const db = new sqlite3.Database('./database.db');

const data = require('./jobs.json')
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
console.log(data);


// Create or connect to the database file in the server directory
const dbPath = path.join(__dirname, 'jobsDatabase.sqlite'); // Database file path
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to the SQLite database at', dbPath);
    }
});

// db.serialize(() => {
//     db.run(`
//       CREATE TABLE IF NOT EXISTS jobs (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         title TEXT,
//         description TEXT,
//         type TEXT,
//         salary TEXT,
//         location TEXT,
//         company_name TEXT,
//         company_description TEXT,
//         contact_email TEXT,
//         contact_phone TEXT
//       )
//     `);
  
//     db.serialize(() => {
//       data.jobs.forEach(job => {
//         db.run(`
//           INSERT INTO jobs (
//             title, description, type, salary, location, company_name, company_description, contact_email, contact_phone
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `, [
//           job.title,
//           job.description,
//           job.type,
//           job.salary,
//           job.location,
//           job.company.name,
//           job.company.description,
//           job.company.contactEmail,
//           job.company.contactPhone
//         ], (err) => {
//           if (err) {
//             console.error(err);
//           }
//         });
//       });
//     });
//   });

// db.serialize(() => {
//     db.run(`DROP TABLE IF EXISTS jobs`);
//   });



const express = require('express');
const cors = require('cors')
const app = express();
app.use(cors({
    origin: 'http://localhost:5173', // Allow only this origin
}));
app.use(express.json());

app.get('/jobs', (req, res) => {
    db.all('SELECT * FROM jobs', (err, rows) => {
        if (err) {
            res.status(500).send({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.get('/api/jobs/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM jobs WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: "Job not found" });
        } else {
            res.json(row);
        }
    });
});


app.post('/api/jobs', (req, res) => {
    const { title, description, type, salary, location, company_name, company_description, contact_email, contact_phone } = req.body;

    // Insert or find the company in the companies table
    db.get(`SELECT id FROM companies WHERE name = ?`, [company_name], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (row) {
            // Company exists, use its id
            insertJob(row.id);
        } else {
            // Insert new company and use the new id
            db.run(`INSERT INTO companies (name, description, contact_email, contact_phone) VALUES (?, ?, ?, ?)`,
                [company_name, company_description, contact_email, contact_phone],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    insertJob(this.lastID);
                });
        }
    });

    // Function to insert the job
    function insertJob(company_id) {
        db.run(`INSERT INTO jobs (title, description, type, salary, location, company_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [title, description, type, salary, location, company_id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ id: this.lastID });
            });
    }
});


// PUT update a job
app.put('/api/jobs/:id', (req, res) => {
    const { title, description, type, salary, location, company_name, company_description, contact_email, contact_phone } = req.body;
    const id = req.params.id;
    db.run(`UPDATE jobs SET title = ?, description = ?, type = ?, salary = ?, location = ?, company_name = ?, company_description = ?, contact_email = ?, contact_phone = ? WHERE id = ?`,
        [title, description, type, salary, location, company_name, company_description, contact_email, contact_phone, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ updated: this.changes });
        }
    );
});

// DELETE a job
app.delete('/api/jobs/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM jobs WHERE id = ?`, id, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ deleted: this.changes });
    });
});

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

