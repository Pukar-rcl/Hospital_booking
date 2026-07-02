const {
    getDoctorDept,
    getAvailableSlots,
    bookAppointment,
    getDoctorBookings,
    cancelBooking,
    getUserBookings,
    checkSlotAvailability
} = require ('../controllers/bookingController');
const  express = require ('express');
const router = express.Router();

router.post('/getdoctor', getDoctorDept);
router.get('/slots', getAvailableSlots);
router.post('/appointment', bookAppointment);
router.get('/doctor-booking', getDoctorBookings);
router.post('/cancel', cancelBooking);
router.get('/user-booking', getUserBookings);
router.get('/check-slot', checkSlotAvailability);

module.exports = router;