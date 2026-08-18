const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('./database');
const response = require('./Middleware/response');
const globalErrorHandler = require('./Middleware/errorHandler');
const AppError = require('./utils/appError');

const healthRoute = require('./Routes/healthRoute');
const taskRoute = require('./Routes/taskRoute');

const app = express();

app.use(cors({ origin: process.env.URL || '*', credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    skip: (req) => req.path === '/health',
}));
app.use(cookieParser());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: false }));

app.locals.response = response;







app.use('/health', healthRoute);
app.use('/api', taskRoute);

app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

