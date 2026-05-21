const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const notificationRoutes = require('./routes/notifications');

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('University Leadership Appointment System API');
});

// Listen on all interfaces so phones on the LAN can reach the API (not only localhost).
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (0.0.0.0)`);
});

// Keep-alive to prevent early exit
setInterval(() => {}, 1000 * 60);
