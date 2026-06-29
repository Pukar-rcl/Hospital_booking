const doctor = require('../models/doctor')
const logger = require('../config/logger')
const responseFormatter = require('../utils/responseFormat');
const crypto = require ('crypto');
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const Department = require('../models/department');


const addDoctor = async(req,res)=>{
    const {name, department, dutytime} = req.body;
    const urn = req.headers['urn'];

    if(!name || ! department || !dutytime.start || !dutytime.end){
        logger.info({
            status : "empty fields in addDoctor",
            urn : urn
        })

        return res.status(200).json(responseFormatter({
            code: 401,
            message : "empty fields are not allowed",
            data : {name, department, dutytime}
        }))
    }
    const admuserID = req.user.id;
    const admusermail = req.user.email;

    const dep = Department.findOne({department});
    if(!dep){
        logger.info({
            status : "Deparment not found",
            urn : urn
        })

        return res.status(200).json(responseFormatter({
            code: 401,
            message : "Department does not exist",
            data : {name, department, dutytime}
        }))
    }
    const existingDoctor = await doctor.findOne({name, department});

    if(existingDoctor){
        logger.info({
            status : "Doctor already exists",
            urn: urn
        });

        return res.status(200).json(responseFormatter({
            code: 401,
            message : "Doctor already exists"
        }));
    }
    if (!timeRegex.test(dutytime.start) ||!timeRegex.test(dutytime.end)){
        logger.info({
            status : "Invalid date format at add time",
            urn : urn
        })

        return res.status(200).json({
            code : 401,
            message : "Invalid date format",
            data : dutytime

        })
    }

    const docID = crypto.randomInt(10001, 100000);
    if (!departments.includes(req.body.department)) {
    return res.status(400).json(responseFormatter({
        message: 'Invalid department'
    }));
    }
    try{
        const adddoctor = new doctor({
        name : name,
        id : docID,
        department : department,
        departmentId : dep.departmentId,
        dutytime : dutytime,
        createdBy : admuserID
        })
        await adddoctor.save()
        logger.info({
            status : "Doctor added",
            email : admusermail
        })

        return res.status(200).json(responseFormatter({
            code : 201,
            message : "Doctor added",
            data : {name, department, dutytime, admuserID, docID}
        }));
    }catch(error){
        logger.info({
            status : "Doctor add failed",
            urn : urn,
            email : admusermail
        })

        return res.status(200).json({
            code : 201,
            message : {"Doctor add error": error.message},
            data : {name, department, dutytime, admuserID}
        })
    }
}

const updateDoctor = async (req, res)=>{
    const urn = req.headers['urn'];
    const {id} = req.params;
    const {name, department, dutytime} = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (department) updateData.department = department;
    if (dutytime) updateData.dutytime = dutytime;

    try{
        const existingDoctor = await doctor.findOne({id});
        if(!existingDoctor){
        logger.info({
            status : "Doctor doesnot exists",
            urn: urn
        });
        return res.status(200).json(responseFormatter({
            code: 401,
            message : "Doctor is not registered"
        }));
    }

        const updatedDoctor = await doctor.findOneAndUpdate(
        {id},
        {$set: updateData},
        {new: true}
    );
        logger.info({
            status : "Doctor updated",
            urn: urn
        });
        return res.status(200).json(responseFormatter({
            code: 401,
            message : "Doctor updated",
            data : updatedDoctor
        }));
    }catch(error){
        logger.info({
            status : "error at updating doctor",
            urn: urn
        });
        return res.status(200).json(responseFormatter({
            code: 401,
            message : "Doctor update failed",
            data : error.message
        }));
    }
}

const deleteDoctor = async (req,res)=>{
    const {id} = req.params;
    const urn = req.headers['urn'];

    const updatedDoctor = await doctor.findOneAndUpdate(
        {id},
        {$set: {isActive : false}},
        {new: true}
    );

    logger.info({
        status : "doctor soft deletion",
        urn: urn
    })
    return res.status(200).json(responseFormatter({
        code : 400,
        message : "Doctor deleted successfully"
    }))
}    

const readAllDoctors = async(req,res)=>{
    const allDoctors = await doctor.find({isActive : true})
    const urn = req.headers['urn'];

    if(!allDoctors){
        logger.info({
            action : "No doctors added",
            urn : urn 
        })
        res.status(200).json({
            code : 401,
            message : "No doctors found",
        })
    }
    res.status(200).json({
        code : 200,
        message : "All docotrs",
        data : allDoctors
    })
}

const readOneDoctor = async(req, res)=>{
    const urn = req.params['urn'];
    const {id} = req.params;
    const singeDoctor = await doctor.findOne({id})

    if(!singeDoctor){
        logger.info({
            action : "Doctor of said id doesn't exist",
            urn : urn
        })
        return res.status(200).json({
            code : 401,
            message : "Doctor does not exist"
        })
    }
    if(singeDoctor.isActive === false){
        return res.status(200).json({
            code : 401,
            message : "Doctor does not exist"
        })
    }

    logger.info({
        action : "Doctor information given",
        urn : urn
    })

    res.status(200).json(responseFormatter({
        code : 200,
        message : "Doctor information:",
        data : singeDoctor
    }))
}

module.exports = {
    addDoctor,
    updateDoctor,
    deleteDoctor,
    readAllDoctors,
    readOneDoctor
}