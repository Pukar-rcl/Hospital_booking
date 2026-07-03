const jwt = require('jsonwebtoken');
const formatResponse = require('../utils/responseFormat');
const logger = require('../config/logger');

const authMiddleware = (req,res,next)=>{
    if(!req.headers['urn']){
        logger.info({
            action: "urn not provided"
        })
            return res.status(200).json(formatResponse({
                code : 401,
                message: "urn not provided",
        }))
    }
    try{
        const header = req.headers.authorization;

        if(!header){

            logger.info({
            action: "token not provided"
        })
            return res.status(200).json(formatResponse({
                code : 200,
                message: "token not provided"
            }))

        } 

        if(!header.startsWith('Bearer ')){

            logger.info({
                action: "token has no 'Bearer' keyword"
            })

            return res.status(200).json(formatResponse({
                code : 200,
                message: "token must start with 'Bearer'"
            }))
        }
        const token = header.split(' ')[1];

console.log(token);
        if(!token){
            logger.info({
                action: "token error"
            })
            return res.status(200).json(formatResponse({
                code: 401,
                message: "incorrect token",
            }))
        }

        let decoded;
        try{
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("deccc",decoded)
            logger.info({
                action: "JWT verified",
            })
        }catch(error){
            logger.info({
                action: "error occured at JWT verification"
            })

            return res.status(200).json(formatResponse({
                code: 401,
                message : "JWT verification error",
                data : error.message
            }))
        }
        req.user = {
            id : decoded.id,
            role : decoded.role
        }

        // console.log(req.user)
    }catch(error){
        logger.info({
                action: "error at token authentication"
            })

           return res.status(200).json(formatResponse({
                code: 401,
                message : "JWT not provided",
                data: error.message
            }))
    }
    next();
};

module.exports = authMiddleware;