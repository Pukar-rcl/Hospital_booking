const crypto = require('crypto');
const Department = require('../models/department');
const responser = require('../utils/responseFormat');
const logger = require('../config/logger');

const addDepartment = async(req, res)=>{
    const {name, description} = req.body;

    if(!name || name.length < 3){
        logger.info({
            status : "department invalid",
            urn : urn
        })
        return res.status(200).json(responser({
            code : 401,
            message : "department name less that three characters"
        }))
    }
   const existingDEpt = await Department.findOne({name});

   if(existingDEpt){
    return res.status(200).json(responser({
        code : 401,
        message : "Department already exists",
    }))
   }

   const Depid = crypto.randomInt(1000, 100000);
   const urn = req.headers['urn'];

   const department = new Department({
    name : name,
    id : Depid,
    description : description
   })
   try{
    await department.save();
    logger.info({
        status : "department added",
        urn : urn
    })
    return res.status(200).json(responser({
        code : 201,
        message : "department added",
        data : Depid
    }))
    
   }catch(error){
    logger.info({
        status : "error occurred",
        urn : urn,
        data : error.message
    })
    return res.status(200).json(responser({
        code : 401,
        data: error.message
    }))
   }
}

const updateDep = async(req, res)=>{
    const urn = req.headers['urn'];
    const Depid = req.params;
    const {name, description} = req.body;

   try{
    const duplicate = await Department.findOne({name: name});

    if (duplicate) {
    return res.status(200).json(responser({
        code : 401,
        message : "Department name already exists and cannot be changed"
    }));
    }

    const update ={ 
    name : name
   }
   if(description !== undefined){
    update.description = description
   }

    const updatedDept = await Department.findOneAndUpdate(
    {Depid},
    {
        $set: {
            update
        }
    },
    {new: true}
);

    logger.info({
        status : "department updated",
        urn : urn
    })

    return res.status(200).json(responser({
        code: 201,
        message : "user updated",
        data : updatedDept
    }))
   }catch(error){
    logger.info({
        status : "error occurred",
        urn : urn,
        data : error.message
    })
    return res.status(200).json(responser({
        code : 401,
        data: error.message
    }))
   }
}

const getDepsbyID = async(req, res)=>{
    const urn = req.headers['urn'];
    const {id} = req.params;
   const existingDEpt = await Department.findOne({id});

   if(!existingDEpt){
    logger.info({
        status : "dept not found at getDepbyID",
        urn : urn
    })
    return res.status(200).json(responser({
        code : 401,
        message : "Department doesn't exists",
    }))
   }

   return res.status(200).json(responser({
    code : 200,
    message : "Department details :",
    data : existingDEpt
   }))
} 

const getAllDeps = async(req, res)=>{
    try{
    const deps = await Department.find();

    logger.info({
        status : "showing all departments:"
    })

    return res.status(200).json(responser({
        code : 200,
        message: "All departments",
        data : deps
    }))
    }catch(error){
        logger.info({
        status : "error showing all departments:"
    })
        return res.status(200).json(responser({
            code : 401,
            message : "error occured",
            data : error.message
        }))
    }
}

const deletedep = async(req, res)=>{
    const {id} = req.params;
    const urn = req.headers['urn'];

    const deleteDep = await Department.findOne({id});
    if(!deleteDep){
        logger.info({
            status : "department not found",
            urn : urn
        })
        return res.status(200).json(responser({
            code: 401,
            message : `no department of id ${id}`
        }));
    }

    const delDep = await Department.findOneAndDelete({id});

    logger.info({
        status : "department deleted",
        urn : urn
    })

    return res.status(200).json(responser({
        code  :200,
        message : "Department deleted successfully"
    }))
}

module.exports = {
    deletedep,
    updateDep,
    addDepartment,
    getDepsbyID,
    getAllDeps
}