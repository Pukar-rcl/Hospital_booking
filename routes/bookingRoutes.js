const {
    getDoctorDept,getAvailableSlots,bookAppointment,getDoctorBookings,
    cancelBooking,getUserBookings,checkSlotAvailability, bookingDetails} = require('../controllers/bookingController')
const adminmiddle = require('../middelware/adminAuthorization')
const  express = require ('express');
const router = express.Router();

router.post('/getdoctor', getDoctorDept);
router.get('/slots', getAvailableSlots);
router.post('/appointment', bookAppointment);
router.get('/doctor-booking',adminmiddle, getDoctorBookings);
router.post('/cancel', cancelBooking);
router.get('/user-booking', getUserBookings);
router.get('/check-slot', checkSlotAvailability);
router.get ('/allbookings', adminmiddle, bookingDetails);

module.exports = router;