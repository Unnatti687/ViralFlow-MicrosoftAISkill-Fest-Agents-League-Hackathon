const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRoutes = require('./features/auth/routes');
const onboardingRoutes = require('./features/onboarding/routes');
const strategyRoutes = require('./features/strategy/routes');
const videoRoutes = require('./features/videos/routes');
const publisherRoutes = require('./features/publisher/routes');
const analyticsRoutes = require('./features/analytics/routes');
const errorHandler = require('./middleware/errors');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_BASE_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/videos', express.static(path.join(__dirname, '../public/videos')));

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.use('/api', authRoutes);
app.use('/api', onboardingRoutes);
app.use('/api', strategyRoutes);
app.use('/api', videoRoutes);
app.use('/api', publisherRoutes);
app.use('/api', analyticsRoutes);

app.use(errorHandler);

module.exports = app;
