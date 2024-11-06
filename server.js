// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initializeDatabase = require('./database');
const app = express();

// app.use(cors({ origin: 'http://localhost:5173' })); 
// CORS setup
app.use(express.json());


const corsOptions = {
    origin:'https://jobboard-frontend-h57b.onrender.com'  // Production frontend URL
    //  process.env.ENV === 'production' 
    //   ?
    //   :
    //    'http://localhost:5173',                          // Development frontend URL
    // methods: ['GET', 'POST', 'PUT', 'DELETE'],
    // allowedHeaders: ['Content-Type', 'Authorization'],
  };
  
  // Use the CORS middleware
  app.use(cors(corsOptions));
  





let db;

// Initialize the database and configure the server routes once ready
initializeDatabase().then(database => {
    db = database;

    // Create the jobs table if it doesn't exist
    db.run(`
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            type TEXT,
            salary TEXT,
            location TEXT,
            company_name TEXT,
            company_description TEXT,
            contact_email TEXT,
            contact_phone TEXT
        )
    `);

    // Define routes

    // Get all jobs
    app.get('/jobs', (req, res) => {
        const stmt = db.prepare('SELECT * FROM jobs');
        const jobs = [];
        while (stmt.step()) {
            jobs.push(stmt.getAsObject());
        }
        stmt.free();
        res.json(jobs);
    });

    // Get job by ID
    app.get('/api/jobs/:id', (req, res) => {
        const id = req.params.id;
        const stmt = db.prepare('SELECT * FROM jobs WHERE id = ?');
        stmt.bind([id]);
        if (stmt.step()) {
            res.json(stmt.getAsObject());
        } else {
            res.status(404).json({ error: "Job not found" });
        }
        stmt.free();
    });

    // Add a new job
    app.post('/api/jobs', (req, res) => {
        const { title, description, type, salary, location, company_name, company_description, contact_email, contact_phone } = req.body;
        const stmt = db.prepare(`
            INSERT INTO jobs (title, description, type, salary, location, company_name, company_description, contact_email, contact_phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.bind([title, description, type, salary, location, company_name, company_description, contact_email, contact_phone]);
        stmt.step();
        res.status(201).json({ message: "Job created successfully" });
        stmt.free();
    });

    // Update a job
    app.put('/api/jobs/:id', (req, res) => {
        const { title, description, type, salary, location, company_name, company_description, contact_email, contact_phone } = req.body;
        const id = req.params.id;
        const stmt = db.prepare(`
            UPDATE jobs SET title = ?, description = ?, type = ?, salary = ?, location = ?, company_name = ?, company_description = ?, contact_email = ?, contact_phone = ?
            WHERE id = ?
        `);
        stmt.bind([title, description, type, salary, location, company_name, company_description, contact_email, contact_phone, id]);
        stmt.step();
        res.json({ message: "Job updated successfully" });
        stmt.free();
    });

    // Delete a job
    app.delete('/api/jobs/:id', (req, res) => {
        const id = req.params.id;
        const stmt = db.prepare(`DELETE FROM jobs WHERE id = ?`);
        stmt.bind([id]);
        stmt.step();
        res.json({ message: "Job deleted successfully" });
        stmt.free();
    });

    // Start the server
    const PORT = process.env.PORT;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(error => {
    console.error("Failed to initialize the database:", error);
});
