const doctor = require('../models/doctor')
const logger = require('../config/logger')
const responseFormatter = require('../utils/responseFormat');
const crypto = require ('crypto');
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const Department = require('../models/department');


const addDoctor = async(req,res)=>{
    const {name, department, dutytime, averagetime} = req.body;
    const urn = req.headers['urn'];

    if(!name || ! department || !dutytime.start || !dutytime.end || averagetime === null){
        logger.info({
            status : "empty fields in addDoctor",
            urn : urn
        })

        return res.status(200).json(responseFormatter({
            code: 401,
            message : "empty fields are not allowed",
            data : {name, department, dutytime, averagetime}
        }))
    }
    const admuserID = req.user.id;
    const admusermail = req.user.email;

    const dep = await Department.findOne({name: department});
    if(!dep){
        logger.info({
            status : "Deparment not found",
            urn : urn
        })

        return res.status(200).json(responseFormatter({
            code: 401,
            message : "Department does not exist",
            data : {name, department, dutytime, averagetime}
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
    const[shour, sminute] = dutytime.start.split(':').map(Number);
    const [hour, minute] = dutytime.end.split(':').map(Number);

    const start = (shour * 60) + (sminute);
    const end = (hour *60) + (minute);

    totaltime = end - start;

    if(averagetime > totaltime){
        logger.info({
            status : "average time input exceeds total time"
        })
        return res.status(200).json(responseFormatter({
            code :401,
            message : "average time input exceeds total working time"
        }))
    }

    const docID = crypto.randomInt(10001, 100000);
    try{
        const adddoctor = new doctor({
        name : name,
        id : docID,
        department : department,
        departmentId : dep.id,
        dutytime : dutytime,
        createdBy : admuserID,
        averagetime : averagetime
        })
        await adddoctor.save()
        logger.info({
            status : "Doctor added",
            email : admusermail
        })

        return res.status(200).json(responseFormatter({
            code : 201,
            message : "Doctor added",
            data : {name, department, dutytime, admuserID, docID, averagetime}
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
    const {name, department, dutytime, averagetime} = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (department) updateData.department = department;
    if (dutytime) updateData.dutytime = dutytime;
    if(averagetime) updateData.averagetime = averagetime;

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
    const[shour, sminute] = dutytime.start.split(':').map(Number);
    const [hour, minute] = dutytime.end.split(':').map(Number);
    const start = (shour * 60) + (sminute);
    const end = (hour *60) + (minute);

    totaltime = end - start;

    if(averagetime > totaltime){
        logger.info({
            status : "average time input exceeds total time"
        })
        return res.status(200).json(responseFormatter({
            code :401,
            message : "average time input exceeds total working time"
        }))
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

const doctorByDepartmentID = async(req,res)=>{
    const urn = req.headers['urn'];
    const { departmentID } = req.body;
    try {
        const doctors = await doctor.find({
        departmentId: departmentID,
        isActive: true
        });
        if (doctors.length === 0) {
            logger.info({
                status: "error: no doctors in department",
                urn: urn
            });
            return res.status(200).json(responseFormatter({
                code: 401,
                message: "No Doctors in this department",
                data: null
            }));
        }
        return res.status(200).json(responseFormatter({
            code : 200,
            message : "doctors in department:",
            data : doctors
        }))
    } catch (error) {
        logger.error({
            status: "error",
            message: error.message,
            urn: urn
        });
        return res.status(500).json(responseFormatter({
            code: 500,
            message: "Internal server error",
            data: null
        }));
    }
};


module.exports = {
    addDoctor,
    updateDoctor,
    deleteDoctor,
    readAllDoctors,
    readOneDoctor,
    doctorByDepartmentID
}