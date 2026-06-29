const mongoose = require ('mongoose');

async function ConnectMongo() {
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("Mongo Db connected");
    }catch(error){
        console.log("error occured", error)
    }   
}

module.exports = ConnectMongo;