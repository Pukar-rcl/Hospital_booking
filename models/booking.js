const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
    Pid:{
        type : Number,
        required : true,
        ref : 'User'
    },
    Did:{
        type : Number,
        required : true,
        ref : 'Doctor'
    },
    bookingDate:{type : Date, required : true},
    bookingStart : {
            type : Date,
            required : true
        },
    bookingEnd:{
            type : Date,
            required : true
    },
    bookingId :{type : Number, required : true}
})

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;