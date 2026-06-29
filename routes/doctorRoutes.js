const express = require('express');
const router = express.Router()
const authMiddleware = require('../middelware/auth');
const {addDoctor,updateDoctor,deleteDoctor,readAllDoctors,readOneDoctor} = require('../controllers/doctorController')

router.post('/add/doctor', authMiddleware, addDoctor);
router.patch('/update/doctor/:id', authMiddleware, updateDoctor);
router.delete('/delete/doctor/:id',authMiddleware, deleteDoctor);
router.get('/getall/doctor', authMiddleware,readAllDoctors);
router.get('/getone/doctor/:id', authMiddleware,readOneDoctor);

module.exports = router;