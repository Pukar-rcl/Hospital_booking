const mongoose = require('mongoose');

const doctor = mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    id:{
        type: Number,
        required: true
    },
    department:{
        type : String,
        required: true
    },
    departmentId:{
        type : Number,
        ref  :'Department',
        required : true
    },
    dutytime:{
        start: {
        type: String,
        required : true
        },
        end:{
            type : String,
            required : true
        }
    },
    createdBy: {
        type: Number,
        ref: 'Admin',
        required: true
    },
    isActive:{
        type : Boolean,
        enums : [true , false],
        default : true
    }
})

module.exports = mongoose.model('Doctor', doctor);