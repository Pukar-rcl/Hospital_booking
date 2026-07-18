const admin = require('../models/admin');
const logger = require('../config/logger');
const formatResponce = require('../utils/responseFormat');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


//admin validation
const adminAuthReg = async (req,res)=>{
    const {email, name, password} = req.body;
    const urn = req.headers['urn'];
    const existingAdmin = await admin.findOne({email, name})

    if(existingAdmin){
        logger.info({
            action : "admin already exists",
            urn: urn
        })

        return res.status(200).json(formatResponce({
            code : 401,
            message: "User already exists"
        }))
    }

    if(!email || email.length < 6 || !email.includes('@') || !email.includes('.')){
        logger.info({
            action : "email not valid",
            urn : urn
        })

        return res.status(200).json(formatResponce({
            code : 401,
            message: "email is not valid"
        }))
    }

    if(!password|| password.length < 6){
        logger.info({
            action : "password not valid",
            urn : urn
        })

        return res.status(200).json(formatResponce({
            code : 401,
            message: "password is not valid, must be at least 6 characters long"
        }))
    }

    if(!name|| name.length<6){
        logger.info({
            action : "name is not valid",
            urn : urn
        })

        return res.status(200).json(formatResponce({
            code : 401,
            message: "name must be at least 6 characters long"
        }))
    }
    
    try{
        const encrypted_password = await bcrypt.hash(password, 10);
        const randomID = crypto.randomInt(10001, 100000);

        const newAdmin = new admin({
            email : email,
            name: name,
            role : 'admin',
            password : encrypted_password,
            id : randomID
        })
        await newAdmin.save();

        logger.info({
            action : "Admin created",
            urn: urn
        })
        return res.status(200).json(formatResponce({
            code : 201,
            message: "Admin created successfully"
        }))
    }catch(error){
        logger.info({
            action : "Admin could not be created",
            urn: urn
    })
        return res.status(200).json(formatResponce({
            code : 201,
            message: "Admin creation error",
            data : error.message
        }))
    }
}
//admin login
const adminAuthLogin= async(req,res)=>{
    const {email, password} = req.body;

    const urn = req.headers['urn'];

    const existingAdmin = await admin.findOne({email})

    if(!existingAdmin){
        logger.info({
            action: "Admin does not exist",
            urn: urn
        })
        return res.status(200).json(formatResponce({
            message : "Admin could not be found",
            data : null,
            code : 401
        }))
    }

    const checkpassword = await bcrypt.compare(password, existingAdmin.password);

    if(!checkpassword){
        logger.info({
            action : "password is incorrect",
            urn: urn
        })
        return res.status(200).json(formatResponce({
            code : 401,
            message : "Incorrect password",
            data : password
        }))
    }
//token
    const token = jwt.sign({
        id: existingAdmin.id,
        role : existingAdmin.role 
    },
    process.env.JWT_SECRET,
    {expiresIn: '7d'});

    logger.info({
        action: "Login for admin",
        urn : urn
    })
    req.user = {
        id: existingAdmin.id,
        role : existingAdmin.role 
    }

    return res.status(200).json(formatResponce({
        code : 201,
        message : "Login successful",
        data : token
    }))
}

module.exports = {adminAuthReg, adminAuthLogin};