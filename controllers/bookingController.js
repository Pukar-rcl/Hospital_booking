const User = require('../models/User');
const Doctor = require('../models/doctor');
const Booking = require('../models/booking');
const responseFormat = require('../utils/responseFormat');
const logger = require('../config/logger'); 
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const {redis_client} = require('../config/redis');

const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

const addMinutesToTime = (timeStr, minutesToAdd) => {
    const totalMinutes = timeToMinutes(timeStr) + minutesToAdd;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const getDateRange = (dateStr) => {
    const date = new Date(dateStr);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

const generateBookingId = () => {
    return crypto.randomInt(100000, 999999);
};

const getDoctorDept = async (req, res) => {
    const urn = req.headers['urn'];
    const { departmentName } = req.body;
    try {
        const dept = await Doctor.find({ department : departmentName });
        if (!dept) {
            logger.info({
                status: "error: incorrect department",
                urn: urn
            });
            return res.status(200).json(responseFormat({
                code: 401,
                message: "INCORRECT DEPARTMENT",
                data: null
            }));
        }
        const depID = dept.id;
        const doctorsOfDepartment = await Doctor.find({ 
            departmentId: depID,
            isActive: true 
        });

        if (!doctorsOfDepartment || doctorsOfDepartment.length === 0) {
            logger.info({
                status: "no doctor in department",
                urn: urn
            });
            return res.status(200).json(responseFormat({
                code: 401,
                message: "No doctor exists in department",
                data: null
            }));
        }
        return res.status(200).json(responseFormat({
            code: 200,
            message: "Available doctors from department",
            data: {
                departmentName,
                doctors: doctorsOfDepartment
            }
        }));
    } catch (error) {
        logger.error({
            status: "error",
            message: error.message,
            urn: urn
        });
        return res.status(500).json(responseFormat({
            code: 500,
            message: "Internal server error",
            data: null
        }));
    }
};

const getAvailableSlots = async (req, res) => {
    const urn = req.headers['urn'];
    const { doctorID, bookingDate } = req.body;
    try {
        const doctor = await Doctor.findOne({ id: doctorID });
        if (!doctor) {
            return res.status(200).json(responseFormat({
                code: 401,
                message: "Doctor not found",
                data: null
            }));
        }
        const dutyStart = doctor.dutytime.start;
        const dutyEnd = doctor.dutytime.end;
        const averageTime = doctor.averagetime || 30; 

        const {start, end} = getDateRange(bookingDate);
        const existingBookings = await Booking.find({
            Did: doctorID,
            bookingStart: {
                $gte: start,
                $lte: end
            }
        });
        const availableSlots = [];
        let currentTime = timeToMinutes(dutyStart);
        const endTime = timeToMinutes(dutyEnd);

        while (currentTime + averageTime <= endTime) {
            const slotStart = minutesToTime(currentTime);
            const slotEnd = minutesToTime(currentTime + averageTime);
            const key = `lock:${doctorID}:${bookingDate}:${slotStart}`;
            const locked = await redis.exists(key);
            const isBooked = existingBookings.some(booking => {
                const bookingStart = new Date(booking.bookingStart);
                const bookingEnd = new Date(booking.bookingEnd);
                const bookingStartMinutes = bookingStart.getHours() * 60 + bookingStart.getMinutes();
                const bookingEndMinutes = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();
                return (currentTime >= bookingStartMinutes && currentTime < bookingEndMinutes) ||
                       (currentTime + averageTime > bookingStartMinutes && 
                        currentTime + averageTime <= bookingEndMinutes);
            });
            if (!isBooked && !locked) {
                availableSlots.push({
                    startTime: slotStart,
                    endTime: slotEnd
                });
            }
            currentTime += averageTime;
        }
        return res.status(200).json(responseFormat({
            code: 200,
            message: "Available time slots",
            data: {
                doctorName: doctor.name,
                date: bookingDate,
                dutyHours: doctor.dutytime,
                averageConsultationTime: averageTime,
                availableSlots
            }
        }));
    } catch (error) {
        logger.error({
            status: "error",
            message: error.message,
            urn: urn
        });
        return res.status(500).json(responseFormat({
            code: 500,
            message: "Internal server error",
            data: null
        }));
    }
};

const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const bookAppointment = async (req, res) => {
    const urn = req.headers['urn'];
    const { userID, doctorID, bookingDate, bookingStartTime } = req.body;
    try {
        const user = await User.findOne({ id: userID });
        if (!user) {
            return res.status(200).json(responseFormat({
                code: 401,
                message: "User not found",
                data: null
            }));
        }
        const doctor = await Doctor.findOne({ id: doctorID });
        if (!doctor) {
            return res.status(200).json(responseFormat({
                code: 401,
                message: "Doctor not found",
                data: null
            }));
        }
        if (!doctor.isActive) {
            return res.status(200).json(responseFormat({
                code: 401,
                message: "Doctor is not available",
                data: null
            }));
        }
        const locked = await redisLock(
            doctorID,
            bookingDate,
            bookingStartTime,
            userID
        );

        if (!locked) {
            return res.status(200).json(responseFormat({
                code: 409,
                message: "This slot is temporarily reserved.",
                data: null
            }));
}
        const bookingTimeMinutes = timeToMinutes(bookingStartTime);
        const dutyStart = timeToMinutes(doctor.dutytime.start);
        const dutyEnd = timeToMinutes(doctor.dutytime.end);
        const averageTime = doctor.averagetime;
        if (bookingTimeMinutes < dutyStart || 
            bookingTimeMinutes + averageTime > dutyEnd) {
            return res.status(200).json(responseFormat({
                code: 401,
                message: "Booking time is outside doctor's duty hours",
                data: null
            }));
        }
        const bookingEndTime = addMinutesToTime(bookingStartTime, averageTime);

        console.log({
        bookingDate,
        bookingStartTime,
        averageTime,
        bookingEndTime
        });
        const {start, end} = getDateRange(bookingDate);
        const existingBooking = await Booking.findOne({
            Did: doctorID,
            bookingStart: {
                $gte: start,
                $lte: end
            },
            $or: [
                {
                    bookingStart: {
                        $lte: new Date(`${bookingDate}T${bookingStartTime}:00`),
                        $gte: new Date(`${bookingDate}T${bookingStartTime}:00`)
                    }
                },
                {
                    bookingEnd: {
                        $gte: new Date(`${bookingDate}T${bookingStartTime}:00`),
                        $lte: new Date(`${bookingDate}T${bookingEndTime}:00`)
                    }
                },
                {
                    $and: [
                        { bookingStart: { $gte: new Date(`${bookingDate}T${bookingStartTime}:00`) } },
                        { bookingEnd: { $lte: new Date(`${bookingDate}T${bookingEndTime}:00`) } }
                    ]
                }
            ]
        });
        if (existingBooking) {
            return res.status(200).json(responseFormat({
                code: 401,
                message: "Time slot is already booked",
                data: null
            }));
        }
        const bookingId = generateBookingId();
        const booking = new Booking({
            Pid: userID,
            Did: doctorID,
            bookingDate: bookingDate,
            bookingStart: new Date(`${bookingDate}T${bookingStartTime}:00`),
            bookingEnd: new Date(`${bookingDate}T${bookingEndTime}:00`),
            bookingId: bookingId
        });
        await booking.save();
        logger.info({
            status: "success",
            message: "Booking created successfully",
            urn: urn,
            bookingId: bookingId
        });

        const transport = nodemailer.createTransport({
            service: 'gmail',
        auth: {
            user: process.env.MAIL,        
            pass: process.env.MAIL_PASS   
            }
        })
        const mailOpt = {
        from: process.env.MAIL,
        to: user.email,
        subject: 'Hospital appointment booking',
        text: `
        ID : ${bookingId},
        Doctor name: ${doctor.name},
               Date: ${bookingDate},
                Time : ${bookingStartTime},
                till :${bookingEndTime}`
        };

        transport.sendMail(mailOpt, (error, info) =>{
              if (error) {
    console.log('Error occurred:', error);
  } else {
    console.log('Email sent successfully:', info.response);
  }
        })
      
        return res.status(200).json(responseFormat({
            code: 200,
            message: "Appointment booked successfully",
            data: {
                bookingId: bookingId,
                doctorName: doctor.name,
                date: bookingDate,
                startTime: bookingStartTime,
                endTime: bookingEndTime
            }
        }));
    } catch (error) {
        logger.error({
            status: "error",
            message: error.message,
            urn: urn
        });
        return res.status(500).json(responseFormat({
            code: 500,
            message: "Internal server error",
            data: null
        }));
    }finally {
    await releaseLock(
        doctorID,
        bookingDate,
        bookingStartTime
    );
}
};
const getDoctorBookings = async (req, res) => {
    const urn = req.headers['urn'];
    const { doctorID, bookingDate } = req.body;
    try {
        const { start, end } = getDateRange(bookingDate);
        const bookings = await Booking.find({
            Did: doctorID,
            bookingStart: {
                $gte: start,
                $lte: end
            }
        }).populate('Pid', 'name email phone'); 
        return res.status(200).json(responseFormat({
            code: 200,
            message: "Doctor's bookings",
            data: bookings
        }));
    } catch (error) {
        logger.error({
            status: "error",
            message: error.message,
            urn: urn
        });
        return res.status(500).json(responseFormat({
            code: 500,
            message: "Internal server error",
            data: null
        }));
    }
};

const cancelBooking = async (req, res) => {
    const urn = req.headers['urn'];
    const { bookingId, userID } = req.body;
    try {
        const booking = await Booking.findOne({ 
            bookingId: bookingId,
            Pid: userID 
        });
        if (!booking) {
            return res.status(200).json(responseFormat({
                code: 401,
                message: "Booking not found or unauthorized",
                data: null
            }));
        }
        // /_\if booking can be cancelled? -not within 2 hours of appointment 
        const now = new Date();
        const bookingTime = new Date(booking.bookingStart);
        const hoursDifference = (bookingTime - now) / (1000 * 60 * 60);
        if (hoursDifference < 2) {
            return res.status(200).json(responseFormat({
                code: 401,
                message: "Cannot cancel booking within 2 hours of appointment",
                data: null
            }));
        }
        await Booking.deleteOne({ bookingId: bookingId });
        logger.info({
            status: "success",
            message: "Booking cancelled successfully",
            urn: urn,
            bookingId: bookingId
        });
        return res.status(200).json(responseFormat({
            code: 200,
            message: "Booking cancelled successfully",
            data: null
        }));
    } catch (error) {
        logger.error({
            status: "error",
            message: error.message,
            urn: urn
        });
        return res.status(500).json(responseFormat({
            code: 500,
            message: "Internal server error",
            data: null
        }));
    }
};

const getUserBookings = async (req, res) => {
    const urn = req.headers['urn'];
    const { userID } = req.body;
    try {
        const bookings = await Booking.find({ Pid: userID })
            .populate('Did', 'name department')
            .sort({ bookingStart: 1 });
        return res.status(200).json(responseFormat({
            code: 200,
            message: "User's bookings",
            data: bookings
        }));
    } catch (error) {
        logger.error({
            status: "error",
            message: error.message,
            urn: urn
        });
        return res.status(500).json(responseFormat({
            code: 500,
            message: "Internal server error",
            data: null
        }));
    }
};

const checkSlotAvailability = async (req, res) => {
    const urn = req.headers['urn'];
    const { doctorID, bookingDate, bookingStartTime } = req.body;
    const {userID} = req.user;
    const locked = await redisLock(
    doctorID,
    bookingDate,
    bookingStartTime,
    userID   
    );
    if(!locked){

        logger.info({
                status : "redis key found"
            })
        return res.status(200).json(responseFormat({
            code : 401,
            message : "Slot already booked",
            data : null
        })
        )
        
    }
    try {
        const doctor = await Doctor.findOne({ id: doctorID });
        if (!doctor) {
            return res.status(200).json(responseFormat({
                code: 401,
                message: "Doctor not found",
                data: null
            }));
        }
        const averageTime = doctor.averagetime || 30;
        const bookingEndTime = addMinutesToTime(bookingStartTime, averageTime);
        const bookingTimeMinutes = timeToMinutes(bookingStartTime);
        const dutyStart = timeToMinutes(doctor.dutytime.start);
        const dutyEnd = timeToMinutes(doctor.dutytime.end);

        if (bookingTimeMinutes < dutyStart || 
            bookingTimeMinutes + averageTime > dutyEnd) {
            return res.status(200).json(responseFormat({
                code: 401,
                message: "Time is outside doctor's duty hours",
                data: { available: false }
            }));
        }
        const { start, end } = getDateRange(bookingDate);
        const conflictingBooking = await Booking.findOne({
            Did: doctorID,
            bookingStart: {
                $gte: start,
                $lte: end
            },
            $or: [
                {
                    bookingStart: {
                        $lte: new Date(`${bookingDate}T${bookingStartTime}:00`),
                        $gte: new Date(`${bookingDate}T${bookingStartTime}:00`)
                    }
                },
                {
                    bookingEnd: {
                        $gte: new Date(`${bookingDate}T${bookingStartTime}:00`),
                        $lte: new Date(`${bookingDate}T${bookingEndTime}:00`)
                    }
                }
            ]
        });
        if (conflictingBooking) {

        const key = `lock:${doctorID}:${bookingDate}:${bookingStartTime}`;
        await redis_client.del(key);

        return res.status(200).json(responseFormat({
            code: 401,
            message: "Time slot not available",
            data: {
                available: false
            }
        }));
}
        const available = !conflictingBooking;

        return res.status(200).json(responseFormat({
            code: 200,
            message: available ? "Time slot available" : "Time slot not available",
            data: { available }
        }));
    } catch (error) {
        logger.error({
            status: "error",
            message: error.message,
            urn: urn
        });
        return res.status(500).json(responseFormat({
            code: 500,
            message: "Internal server error",
            data: null
        }));
    }
};


const bookingDetails = async (req, res)=>{
    const urn  = req.headers['urn'];
    const bookings = await Booking.find();

    const result = [];

    for (const booking of bookings) {
     const patient = await User.findOne({ id: booking.Pid });
     const doctor = await Doctor.findOne({ id: booking.Did });

    result.push({
        Patient: patient.name,
        Doctor: doctor.name,
        Department: doctor.department,
        BookingDate: booking.bookingDate,
        BookingStart: booking.bookingStart,
        BookingEnd: booking.bookingEnd
    });
    }
    logger.info({
        status : "Showing all bookings",
        urn : urn
    })

    return res.status(200).json(responseFormat({
        code  : 200,
        message  :"all bookings : ",
        data : result
    }))
}

const redisLock = async (doctorID,bookingDate,bookingStartTime,userID) => {
    const key = `lock:${doctorID}:${bookingDate}:${bookingStartTime}`;

    const result = await redis_client.set(
        key,
        userID,
        {
            NX: true,// NX sets only if it doesnot already exist
            EX: 300 // 5 X6 0
        }
    );
    return result === "OK";
};

const releaseLock = async (doctorID, bookingDate, bookingStartTime) => {
    const key = `lock:${doctorID}:${bookingDate}:${bookingStartTime}`;

    await redis_client.del(key);
};

module.exports = {
    bookingDetails,
    getDoctorDept,
    getAvailableSlots,
    bookAppointment,
    getDoctorBookings,
    cancelBooking,
    getUserBookings,
    checkSlotAvailability
};