const formatter = require('./responseFormat');

const validateRegistration =(name, email, password, phone)=>{
    if(!name || name.length <6){
        return false;
    }

    if(email.length<6 || !email || email!==email.toLowerCase() || !email.includes('.com')){
        return false;
    }
    

    if(!password || password.length <6){
        return false;
    }
    

    if(!phone|| phone.toString().length < 10 || !phone.toString().startsWith('9')){
        return false;
    }


    return true;
}

const validateLogin = (email , password)=>{
    if(!email || email!==email.toLowerCase() || !email.includes('@gmail.com')){
        return false;
    }
    

    if(!password || password.toString().length <6){
        return false;
    }
}

module.exports = {
    validateLogin,
    validateRegistration
}