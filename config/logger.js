const pino = require('pino');

const logger = pino({
    level: "info",
    timestamp: () => `,"time":"${new Date().toISOString()}"`
}, pino.transport({
    target: 'pino-pretty',
    options: {
        colorize: true,
        translateTime: "SYS:yyyy-mm-dd'T'HH:MM:ss.l'Z'"
    }
}));

module.exports = logger;