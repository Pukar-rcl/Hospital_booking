const bcrypt = require('bcrypt');
const jwttoken = require('jsonwebtoken');
const {validateLogin,validateRegistration} = require('../utils/validator');
const User = require('../models/User');
const formatter = require('../utils/responseFormat');
const redis = require('redis');
const redisClient = redis.createClient();
redisClient.connect().catch(err => console.error("Redis Error", err));
const logger = require('../config/logger');
const crypto = require('crypto');

const register = async(req,res)=>{
    try{
        if(!req.headers['urn']){
            return res.status(200).json(formatter({
                code : 401,
                message: "urn not provided",
        }))
        }

        logger.info({
            action: "create user",
            email: req.body.email,
        })

        const {name, email, password, phone} = req.body;
        const urn = req.headers['urn'];
        const validatereg = validateRegistration(name, email, password, phone);


        let{condition} = req.body;

        if(!condition){
            condition = null;
        }

        const existinguser = await User.findOne({email, phone});

        if(existinguser){
            return res.status(200).json(formatter({
                code : 401,
                message: "User already exists",
        }))
        }

        const hashedPass = await bcrypt.hash(password, 10);

        if(!hashedPass){
            return res.status(200).json(formatter({
                code : 500,
                message: "error hashing password",
        }))
    }
        const id = crypto(1000, 100000);
        const user = new User({
            name : name,
            password : hashedPass,
            email:email,
            condition : condition,
            phone : phone,
            id : id
    })

        await user.save();

        return res.status(200).json(formatter({
                code : 201,
                message: "User created successfully",
        }))

    }catch(error){
        logger.info({
            action: "error creating user",
            body: req.body
        })

        console.log("error occured", error);
        return res.status(200).json(formatter({
                code : 500,
                message: {"error occured ": error.message},
        }))
    }
}

const Login = async(req, res)=>{
    try{
        console.log(req.body)
        if(!req.headers['urn']){
            return res.status(200).json(formatter({
                code : 401,
                message: "urn not provided",
        }))
        }

        logger.info({
            action: "Login request",
            email: req.body.email,
        })
        const{email, password} = req.body;
        const validatelogin = validateLogin(email, password);

    const user = await User.findOne({email});

    if(!user){
        return res.status(200).json(formatter({
                code : 401,
                message: "User doesn't exist",
        }))
    }

    const checkPass = await bcrypt.compare(password, user.password);

    if(!checkPass){
         return res.status(200).json(formatter({
                code : 401,
                message: "Invalid credentials",
        }))
    }

    const token = jwttoken.sign({
        email:email,
        role:user.role,
        userId: user._id
    },
    process.env.JWT_SECRET,
    {expiresIn:process.env.JWT_EXPIRY}
    )

    await redisClient.set(`token_${user._id}`, token);

    return res.status(200).json(formatter({
            code : 201,
            message: "Login Success",
            data: token
        }))
    }catch(error){
        console.log(error)
        return res.status(200).json(formatter({
            code : 500,
            message: {"error occured": error.message},
        }))
    }
}

module.exports = {register, Login};