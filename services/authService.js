const bcrypt = require('bcrypt');
const jwttoken = require('jsonwebtoken');
const User = require('../models/User');
const formatter = require('../utils/responseFormat');
const redisClient = require('../config/redis');
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
        const id = crypto.randomInt(1000, 100000);
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

const allUser = async(req,res) =>{
    const user = await User.findOne();

    res.status(200).json(
        formatter({
            code : 200,
            message  :"all users",
            data : user
        })
    )
}
const passwordResetToken = async(req, res)=>{
    const {email} = req.body;
    try{
    const findmail = await User.findOne({
        email
    })

    if(!findmail){
        return res.status(200).json(formatter({
            code : 401,
            message : "User not found",
            data : null
        }))
    }
    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

    await redis.set(
    `reset:${hashedToken}`,
    findmail._id.toString(),
    {
        EX: 900 
    })

    const transport = nodemailer.createTransport({
                service: 'gmail',
            auth: {
                user: process.env.MAIL,        
                pass: process.env.MAIL_PASS   
                }
            })
            const mailOpt = {
            from: process.env.MAIL,
            to: email,
            subject: 'Hospital appointment booking(reset password)',
            text: 
                `${process.env.DOMAIN}/reset-password?token=${resetToken}`
            };
    
            await transport.sendMail(mailOpt, (error, info) =>{
                  if (error) {
        console.log('Error occurred:', error);
      } else {
        console.log('Email sent successfully:', info.response);
      }})
    }catch(error){
        logger.info({
            status : "error at reset password email service"
        })

        return res.status(200).json(formatter({
            code : 400,
            message: "error resetting password",
            data : null
        }))
    }
}

const passwordReset = async (req, res)=> {
    const {token, newPassword} = req.body;
    const hashedToken =  crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");


    const checkToken = await redis.get(`reset:${hashedToken}`);
    if(!checkToken){
        logger.info({
            status : "token expired or empty",
        })

        return res.status(200).json(formatter({
            code : 401,
            message : "token expired",
            data : null
        }))
    }

    const client = await User.findById(checkToken);

    if(!client){
        return res.status(200).json(formatter({
            code : 401,
            message : "User not found",
            data : null
        }))
    }
    try{
        const updatedPassword = await bcrypt.hash(newPassword, 10);
        client.password = updatedPassword;

        await client.save();

        await redis.del(`reset:${hashedToken}`)

        logger.info({
            status : "resetting password"
        })

        return res.status(200).json(formatter({
            code : 200,
            message : "password changed successfully",
            data : null
        }))
    }catch(error){
        logger.info({
            status : "error at resetting password"
        })
        return res.status(200).json(formatter({
            code : 401,
            message : "error at resetting password",
            data : error
        }))
    }
    

}

module.exports = {register, Login, allUser, passwordResetToken, passwordReset};