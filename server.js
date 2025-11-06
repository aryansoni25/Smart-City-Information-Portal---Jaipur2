// server.js - Backend for Smart City Jaipur Portal

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Data storage file
const DATA_FILE = 'users.json';

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Helper function to read users
function readUsers() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
}

// Helper function to write users
function writeUsers(users) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing users:', error);
        return false;
    }
}

// Routes

// Register new user
app.post('/api/register', (req, res) => {
    const { name, email, mobile, location } = req.body;

    // Validation
    if (!name || !email || !mobile || !location) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required' 
        });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid email format' 
        });
    }

    // Mobile validation (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Mobile number must be 10 digits' 
        });
    }

    const users = readUsers();

    // Check if email already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email already registered' 
        });
    }

    // Create new user
    const newUser = {
        id: Date.now(),
        name,
        email,
        mobile,
        location,
        registeredAt: new Date().toISOString()
    };

    users.push(newUser);
    
    if (writeUsers(users)) {
        res.json({ 
            success: true, 
            message: 'Registration successful!',
            user: newUser
        });
    } else {
        res.status(500).json({ 
            success: false, 
            message: 'Error saving user data' 
        });
    }
});

// Get all users (admin route)
app.get('/api/users', (req, res) => {
    const users = readUsers();
    res.json({ 
        success: true, 
        count: users.length,
        users 
    });
});

// Get user by email
app.get('/api/user/:email', (req, res) => {
    const users = readUsers();
    const user = users.find(u => u.email === req.params.email);
    
    if (user) {
        res.json({ success: true, user });
    } else {
        res.status(404).json({ 
            success: false, 
            message: 'User not found' 
        });
    }
});

// Delete user
app.delete('/api/user/:email', (req, res) => {
    let users = readUsers();
    const initialLength = users.length;
    users = users.filter(u => u.email !== req.params.email);
    
    if (users.length < initialLength) {
        writeUsers(users);
        res.json({ 
            success: true, 
            message: 'User deleted successfully' 
        });
    } else {
        res.status(404).json({ 
            success: false, 
            message: 'User not found' 
        });
    }
});

// Get statistics
app.get('/api/stats', (req, res) => {
    const users = readUsers();
    
    // Location-wise stats
    const locationStats = {};
    users.forEach(user => {
        locationStats[user.location] = (locationStats[user.location] || 0) + 1;
    });

    res.json({
        success: true,
        stats: {
            totalUsers: users.length,
            locationWiseUsers: locationStats,
            recentRegistrations: users.slice(-5).reverse()
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 API Endpoints:`);
    console.log(`   POST   /api/register - Register new user`);
    console.log(`   GET    /api/users - Get all users`);
    console.log(`   GET    /api/user/:email - Get specific user`);
    console.log(`   DELETE /api/user/:email - Delete user`);
    console.log(`   GET    /api/stats - Get statistics`);
});