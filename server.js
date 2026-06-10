const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 9482; // Unique port for shared server

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Database Setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error('Database opening error: ', err);
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        sales_person_name TEXT,
        company_name TEXT,
        city TEXT,
        contact_person_1 TEXT,
        contact_1_email TEXT,
        contact_1_phone TEXT,
        contact_person_2 TEXT,
        contact_2_email TEXT,
        contact_2_phone TEXT,
        address TEXT,
        gst TEXT,
        correct_contact_1 TEXT,
        correct_email_1 TEXT,
        correct_phone_1 TEXT,
        correct_contact_2 TEXT,
        correct_email_2 TEXT,
        correct_phone_2 TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        date TEXT,
        comments TEXT,
        sales_man_name TEXT,
        company_name TEXT
    )`);
});

// --- API ENDPOINTS ---

// Get all customers
app.get('/api/customers', (req, res) => {
    db.all('SELECT * FROM customers', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Bulk upload customers
app.post('/api/customers/bulk', (req, res) => {
    const customers = req.body;
    const stmt = db.prepare(`INSERT OR REPLACE INTO customers 
        (id, sales_person_name, company_name, city, contact_person_1, contact_1_email, contact_1_phone, contact_person_2, contact_2_email, contact_2_phone, address, gst, correct_contact_1, correct_email_1, correct_phone_1, correct_contact_2, correct_email_2, correct_phone_2) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        customers.forEach(c => {
            stmt.run([
                c.id, c.sales_person_name, c.company_name, c.city, 
                c.contact_person_1, c.contact_1_email, c.contact_1_phone, 
                c.contact_person_2, c.contact_2_email, c.contact_2_phone, 
                c.address, c.gst, 
                c.correct_contact_1 || '', c.correct_email_1 || '', c.correct_phone_1 || '', 
                c.correct_contact_2 || '', c.correct_email_2 || '', c.correct_phone_2 || ''
            ]);
        });
        db.run('COMMIT', (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Bulk upload successful' });
        });
    });
    stmt.finalize();
});

// Update correction fields
app.put('/api/customers/:id', (req, res) => {
    const { correct_contact_1, correct_email_1, correct_phone_1, correct_contact_2, correct_email_2, correct_phone_2 } = req.body;
    const sql = `UPDATE customers SET 
        correct_contact_1 = ?, correct_email_1 = ?, correct_phone_1 = ?, 
        correct_contact_2 = ?, correct_email_2 = ?, correct_phone_2 = ? 
        WHERE id = ?`;
    
    db.run(sql, [correct_contact_1, correct_email_1, correct_phone_1, correct_contact_2, correct_email_2, correct_phone_2, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Customer updated', changes: this.changes });
    });
});

// Delete customer
app.delete('/api/customers/:id', (req, res) => {
    db.run('DELETE FROM customers WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Customer deleted', changes: this.changes });
    });
});

// Get all activities
app.get('/api/activities', (req, res) => {
    db.all('SELECT * FROM activities', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Log new activity
app.post('/api/activities', (req, res) => {
    const { id, date, comments, sales_man_name, company_name } = req.body;
    const sql = `INSERT INTO activities (id, date, comments, sales_man_name, company_name) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [id, date, comments, sales_man_name, company_name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Activity logged' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
