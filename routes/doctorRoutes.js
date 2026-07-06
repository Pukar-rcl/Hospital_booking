const express = require('express');
const router = express.Router()
const authMiddleware = require('../middelware/auth');
const {addDoctor,updateDoctor,deleteDoctor,readAllDoctors,readOneDoctor, doctorByDepartmentID } = require('../controllers/doctorController')
const adminAuth = require('../middelware/adminAuthorization');

router.get('/getall/doctor', authMiddleware,readAllDoctors);
router.post('/add/doctor',adminAuth, authMiddleware, addDoctor);
router.patch('/update/doctor/:id', adminAuth,authMiddleware, updateDoctor);
router.delete('/delete/doctor/:id',adminAuth,authMiddleware, deleteDoctor);
router.get('/getone/doctor/:id', adminAuth,authMiddleware,readOneDoctor);
router.get('/doctor-by-dep-ID', adminAuth, doctorByDepartmentID)

module.exports = router;