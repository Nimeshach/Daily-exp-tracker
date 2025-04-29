require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const dataFilePath = path.join(__dirname, 'expenses.json');
const usersFilePath = path.join(__dirname, 'users.json');

// Initialize empty files if they don't exist
if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, '[]', 'utf8');
}
if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, '[]', 'utf8');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper functions
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    const user = users.find(u => u.token === token);
    if (!user) return res.status(403).json({ error: 'Invalid token' });

    req.user = user;
    next();
}

// Auth endpoints
app.post('/api/register', (req, res) => {
    try {
        const { username, password } = req.body;
        const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));

        if (users.some(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const newUser = {
            id: Date.now().toString(),
            username,
            password: hashPassword(password),
            token: generateToken()
        };

        users.push(newUser);
        fs.writeFileSync(usersFilePath, JSON.stringify(users), 'utf8');

        res.status(201).json({ token: newUser.token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
        const user = users.find(u => u.username === username && u.password === hashPassword(password));

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate new token on login
        user.token = generateToken();
        fs.writeFileSync(usersFilePath, JSON.stringify(users), 'utf8');

        res.json({ token: user.token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Protected API Endpoints
app.get('/api/expenses', authenticateToken, (req, res) => {
    try {
        const expenses = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        const userExpenses = expenses.filter(expense => expense.userId === req.user.id);
        res.json(userExpenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/expenses', authenticateToken, (req, res) => {
    try {
        const { category, amount, date } = req.body;
        const expenses = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        const newExpense = {
            id: Date.now().toString(),
            userId: req.user.id,
            category,
            amount,
            date
        };
        expenses.push(newExpense);
        fs.writeFileSync(dataFilePath, JSON.stringify(expenses), 'utf8');
        res.status(201).json({ message: 'Expense added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
    try {
        const expenses = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        const filteredExpenses = expenses.filter(expense => 
            !(expense.id === req.params.id && expense.userId === req.user.id)
        );
        fs.writeFileSync(dataFilePath, JSON.stringify(filteredExpenses), 'utf8');
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});