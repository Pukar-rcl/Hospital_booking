const mongoose = require('mongoose');

const admin = mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    password:{
        type : String,
        required: true
    },
    email:{
        type : String,
        required: true,
        unique : true
    },
    id:{
        type : Number,
        required: true
    }
})

module.exports = mongoose.model('Admin',admin);