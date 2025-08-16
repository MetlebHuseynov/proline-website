const express = require('express');
const { protect, admin } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const router = express.Router();

// Helper functions for JSON file operations
const readJSONFile = (filename) => {
    try {
        const filePath = path.join(__dirname, '..', 'data', filename);
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error.message);
        return [];
    }
};

const writeJSONFile = (filename, data) => {
    try {
        const filePath = path.join(__dirname, '..', 'data', filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error.message);
        return false;
    }
};

// Get all users (admin only)
router.get('/', protect, admin, async (req, res) => {
    try {
        const users = readJSONFile('users.json');
        // Remove passwords from response
        const usersWithoutPassword = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        res.json(usersWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new user (admin only)
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name, email, password, role, status } = req.body;
        
        console.log('Creating user with data:', { name, email, role, status });
        
        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email və password tələb olunur' });
        }
        
        const users = readJSONFile('users.json');
        
        // Check if user already exists
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ message: 'Bu email ilə istifadəçi artıq mövcuddur' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate new ID
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        
        // Create new user
        const newUser = {
            id: newId,
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            status: status || 'active',
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        // Save to file
        if (!writeJSONFile('users.json', users)) {
            return res.status(500).json({ message: 'İstifadəçi saxlanılarkən xəta baş verdi' });
        }
        
        // Return user without password
        const { password: _, ...userResponse } = newUser;
        
        console.log('User created successfully:', userResponse);
        res.status(201).json(userResponse);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get user by ID (admin only)
router.get('/:id', protect, admin, async (req, res) => {
    try {
        const users = readJSONFile('users.json');
        const user = users.find(u => u.id == req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update user (admin only)
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { name, email, role, status } = req.body;
        const users = readJSONFile('users.json');
        const userIndex = users.findIndex(u => u.id == req.params.id);
        
        if (userIndex === -1) {
            return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
        }
        
        // Check if email is already taken by another user
        if (email && email !== users[userIndex].email) {
            const existingUser = users.find(u => u.email === email && u.id != req.params.id);
            if (existingUser) {
                return res.status(400).json({ message: 'Bu email ilə başqa istifadəçi mövcuddur' });
            }
        }
        
        // Update user data
        users[userIndex] = {
            ...users[userIndex],
            name: name || users[userIndex].name,
            email: email || users[userIndex].email,
            role: role || users[userIndex].role,
            status: status || users[userIndex].status,
            updatedAt: new Date().toISOString()
        };
        
        // Save to file
        if (!writeJSONFile('users.json', users)) {
            return res.status(500).json({ message: 'İstifadəçi yenilənərkən xəta baş verdi' });
        }
        
        // Return updated user without password
        const { password, ...userResponse } = users[userIndex];
        res.json(userResponse);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete user (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const users = readJSONFile('users.json');
        const userIndex = users.findIndex(u => u.id == req.params.id);
        
        if (userIndex === -1) {
            return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
        }
        
        // Remove user from array
        users.splice(userIndex, 1);
        
        // Save to file
        if (!writeJSONFile('users.json', users)) {
            return res.status(500).json({ message: 'İstifadəçi silinərkən xəta baş verdi' });
        }
        
        res.json({ message: 'İstifadəçi uğurla silindi' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;