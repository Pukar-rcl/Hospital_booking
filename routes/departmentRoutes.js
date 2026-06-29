const express = require('express');
const router = express.Router();

const {deletedep,updateDep,addDepartment,getDepsbyID,getAllDeps} = require('../controllers/departmentController');
router.delete('/dep/del/:id', deletedep);
router.patch('/dep/update', updateDep);
router.post('/dep/add', addDepartment);
router.get('/dep/get/:id', getDepsbyID);
router.get('/dep/get', getAllDeps);

module.exports = router;