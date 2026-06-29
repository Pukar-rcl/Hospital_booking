const logger = require('../config/logger')


const Logger = (req, res, next)=>{
    const urn = req.headers['urn'];
    logger.info({
        timestamp : new Date(),
        urn: `_${urn}`,
        method: req.method,
        email: req.body?.email,
        username: req.body?.name,
        url: req.originalURL,
    })
    next();
}

module.exports = Logger;