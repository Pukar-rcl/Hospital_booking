const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middelware/adminAuthorization');
const authMiddleware = require('../middelware/auth')

const {deletedep,updateDep,addDepartment,getDepsbyID,getAllDeps} = require('../controllers/departmentController');
router.delete('/dep/del/:id',authMiddleware ,adminMiddleware,deletedep);
router.patch('/dep/update/:id',authMiddleware ,adminMiddleware, updateDep);
router.post('/dep/add',authMiddleware , adminMiddleware,addDepartment);
router.get('/dep/get/:id',authMiddleware ,adminMiddleware, getDepsbyID);
router.get('/dep/get',authMiddleware ,adminMiddleware, getAllDeps);

module.exports = router;