const mongoose = require('mongoose');

const department = mongoose.Schema({
    id:{
        type : Number,
        required: true
    },
    name:{
        type: String,
        required : true,
        unique : true
    }
})

module.exports = mongoose.model('Department', department);