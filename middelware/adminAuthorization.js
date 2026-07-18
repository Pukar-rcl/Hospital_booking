const responseformatter = require('../utils/responseFormat')
const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
    console.log("in admin auth", req.user);
    if (req.user.role !== 'admin') {
        return res.status(200).json(responseformatter({
            code : 409,
            message: 'Admin access only'
        }));
    }
    
    next();
};

module.exports = verifyAdmin;