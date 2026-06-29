require('dotenv').config();
const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const ConnectMongo = require('./config/database')
const Logger = require('./middelware/loggerMiddleware');
const cors = require('cors')
const doctorroutes = require('./routes/doctorRoutes')
const adminRoutes = require('./routes/adminRoutes')
const departmentRoutes  = require('./routes/departmentRoutes');

app.use(cors({
  origin: ['http://192.168.1.72:5500', 'http://127.0.0.1:5500', 
    'http://localhost:5500', 'http://192.168.1.84:5174', 'http://localhost:5174'],
  credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(express.json());
// app.use(Logger)
ConnectMongo()
    .then(() => console.log(" MongoDB connected successfully!"))
    .catch(err => console.error(" DB connection failed:", err));

app.use('/api', authRoutes);
app.use('/api/admin', doctorroutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', departmentRoutes);

const PORT = process.env.PORT;

app.listen(PORT, ()=>{
    console.log("Listening on port 4000")
});