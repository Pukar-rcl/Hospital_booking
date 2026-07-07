const responseFormat = require('../utils/responseFormat');

const registervalidate = async(req,res,next) =>{
     const {name, email, password, phone} = req.body;

     if(name.length<6 || !name){
        return res.status(200).json(
            responseFormat({
                code : 401,
                message : "length of name should be at least 6 characters long"
            })
        )
     }

     if(!email || !email.includes('@')){
        return res.status(200).json(
            responseFormat({
                code : 401,
                message : "invalid email"
            })
        )
     }

     if(password.length<6 || !password ){
        return res.status(200).json(
            responseFormat({
                code : 401,
                message : "password must be at least 6 characters long"
            })
        )
     }
     if(phone.length<10 || !phone || !email.includes('9')){
        return res.status(200).json(
            responseFormat({
                code : 401,
                message : "invalid email"
            })
        )
     }

     next();
}

module.exports = registervalidate;