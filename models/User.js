const mongoose = require('mongoose');

const createClient = mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    id:{
        type : Number,
        required : true
    },
    password:{
        type :String,
        required: true
    },
    role:{
        type : String,
        default : 'user'
    },
    createdAt :{
        type: Date,
        default : Date.now()
    },
    email:{
        type:String,
        required: true,
    },
    phone:{
        type : Number,
        required: true
    },
    isActive:{
        type: Boolean,
        enums : [true, false],
        default: true
    },
})

module.exports = mongoose.model('User', createClient);