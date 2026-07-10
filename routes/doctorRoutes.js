const express = require('express');
const router = express.Router()
const authMiddleware = require('../middelware/auth');
const {addDoctor,updateDoctor,deleteDoctor,readAllDoctors,readOneDoctor, doctorByDepartmentID } = require('../controllers/doctorController')
const adminAuth = require('../middelware/adminAuthorization');

router.get('/getall/doctor', authMiddleware,readAllDoctors);
router.post('/add/doctor',adminAuth, authMiddleware, addDoctor);
router.patch('/update/doctor/:id', adminAuth,authMiddleware, updateDoctor);
router.delete('/delete/doctor/:id',adminAuth,authMiddleware, deleteDoctor);
router.post('/getone/doctor/:id', authMiddleware,readOneDoctor);
router.post('/doctor-by-dep-ID', authMiddleware, doctorByDepartmentID)

module.exports = router;