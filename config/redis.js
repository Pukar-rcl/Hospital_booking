const {createClient} = require('redis');

const redis_client = createClient({
    url : process.env.REDIS_URL
});


redis_client.on("connect", ()=>{
    console.log("redis connected");
})

redis_client.on("ready", ()=>{
    console.log("redis ready");
})

redis_client.on("error", (err)=>{
    console.log("error occured on redis",err)
})

redis_client.connect()

module.exports = {
    redis_client
}