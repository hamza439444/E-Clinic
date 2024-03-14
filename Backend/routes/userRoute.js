const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");
const Appointment = require("../models/appointmentModel");
const moment = require("moment");

const stripe = require("stripe")(process.env.STRIPE_KEY);
const { v4: uuidv4 } = require("uuid");

router.post("/register", async (req, res) => {
  try {
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) {
      return res
        .status(200)
        .send({ message: "User already exists", success: false });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    const newuser = new User(req.body);
    await newuser.save();
    res
      .status(200)
      .send({ message: "User created successfully", success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error creating user", success: false, error });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(200)
        .send({ message: "User does not exist", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Password is incorrect", success: false });
    } else {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res
        .status(200)
        .send({ message: "Login successful", success: true, data: token });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error logging in", success: false, error });
  }
});

router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.password = undefined;
    if (!user) {
      return res
        .status(200)
        .send({ message: "User does not exist", success: false });
    } else {
      res.status(200).send({
        success: true,
        data: user,
      });
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting user info", success: false, error });
  }
});

router.post("/apply-doctor-account", authMiddleware, async (req, res) => {
  try {
    const newdoctor = new Doctor({ ...req.body, status: "pending" });
    await newdoctor.save();
    const adminUser = await User.findOne({ isAdmin: true });

    const unseenNotifications = adminUser.unseenNotifications;
    unseenNotifications.push({
      type: "new-doctor-request",
      message: `${newdoctor.firstName} ${newdoctor.lastName} has applied for a doctor account`,
      data: {
        doctorId: newdoctor._id,
        name: newdoctor.firstName + " " + newdoctor.lastName,
      },
      onClickPath: "/admin/doctorslist",
    });
    await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });
    res.status(200).send({
      success: true,
      message: "Doctor account applied successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying doctor account",
      success: false,
      error,
    });
  }
});
router.post(
  "/mark-all-notifications-as-seen",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.body.userId });
      const unseenNotifications = user.unseenNotifications;
      const seenNotifications = user.seenNotifications;
      seenNotifications.push(...unseenNotifications);
      user.unseenNotifications = [];
      user.seenNotifications = seenNotifications;
      const updatedUser = await user.save();
      updatedUser.password = undefined;
      res.status(200).send({
        success: true,
        message: "All notifications marked as seen",
        data: updatedUser,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error applying doctor account",
        success: false,
        error,
      });
    }
  }
);

router.post("/delete-all-notifications", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.seenNotifications = [];
    user.unseenNotifications = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "All notifications cleared",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying doctor account",
      success: false,
      error,
    });
  }
});

router.get("/get-all-approved-doctors", authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "approved" });
    res.status(200).send({
      message: "Doctors fetched successfully",
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying doctor account",
      success: false,
      error,
    });
  }
});

router.post("/book-appointment", authMiddleware, async (req, res) => {
  try {
    const fee = req.body.doctorInfo.feePerCunsultation;
    req.body.status = "pending";
    req.body.date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    req.body.time = moment(req.body.time, "HH:mm").toISOString();

    const { token } = req.body;
    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id,
    });
    const payment = await stripe.charges.create(
      {
        amount: fee * 100,
        customer: customer.id,
        currency: "PKR",
        receipt_email: token.email,
      },
      { idempotencyKey: uuidv4() }
    );
    req.body.appointmentPaymentId = payment.id;
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    const user = await User.findOne({ _id: req.body.doctorInfo.userId });
    //pushing notification to doctor based on his userid
    user.unseenNotifications.push({
      type: "new-appointment-request",
      message: `A new appointment request has been made by ${req.body.userInfo.name}`,
      onClickPath: "/doctor/appointments",
    });
    await user.save();
    res.status(200).send({
      message: `Appointment booked successfully with Dr. ${newAppointment.doctorInfo.firstName} ${newAppointment.doctorInfo.lastName}`,
      // message: "Appointment booked successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      // message: "Error booking appointment",
      success: false,
      error,
    });
  }
});
//   purana youtube wala code
// router.post("/check-booking-availability", authMiddleware, async (req, res) => {
//   try {
//     const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
//     const fromTime = moment(req.body.time, "HH:mm")
//       .subtract(1, "hours")
//       .toISOString();
//     const toTime = moment(req.body.time, "HH:mm").add(1, "hours").toISOString();
//     const doctorId = req.body.doctorId;

//     const appointments = await Appointment.find({
//       doctorId,
//       date,
//       time: { $gte: fromTime, $lte: toTime },
//     });
//     if (appointments.length > 0) {
//       return res.status(200).send({
//         message: "Appointments not available",
//         success: false,
//       });
//     } else {
//       return res.status(200).send({
//         message: "Appointments available",
//         success: true,
//       });
//     }

//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       message: "Error booking appointment",
//       success: false,
//       error,
//     });
//   }
// });

// chatgpt ka new code jo running phase mai hai
// router.post("/check-booking-availability", authMiddleware, async (req, res) => {
//   try {
//     const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
//     const selectedTime = moment(req.body.time, "HH:mm");
//     const doctorId = req.body.doctorId;

//     const doctor = await Doctor.findById(doctorId);

//     if (!doctor) {
//       return res.status(404).send({
//         message: "Doctor not found",
//         success: false,
//       });
//     }

//     const fromTime = moment(doctor.timings[0], "HH:mm");
//     const toTime = moment(doctor.timings[1], "HH:mm");

//     if (selectedTime.isBefore(fromTime) || selectedTime.isAfter(toTime)) {
//       return res.status(200).send({
//         message: "Appointment time is outside of doctor's working hours",
//         success: false,
//       });
//     }

//     const appointments = await Appointment.find({
//       doctorId,
//       date,
//     });

//     const isAvailable = appointments.every((appointment) => {
//       const appointmentTime = moment(appointment.time);
//       const timeDiff = Math.abs(selectedTime.diff(appointmentTime, "minutes"));
//       return timeDiff >= 60; // Check if the time difference is at least 60 minutes (1 hour)
//     });

//     if (isAvailable) {
//       return res.status(200).send({
//         message: "Appointment slot available",
//         success: true,
//       });
//     } else {
//       return res.status(200).send({
//         message: "Appointment slot not available",
//         success: false,
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       message: "Error checking appointment availability",
//       success: false,
//       error,
//     });
//   }
// });

router.post("/check-booking-availability", authMiddleware, async (req, res) => {
  try {
    const currentDate = moment().startOf("day");
    const selectedDate = moment(req.body.date, "DD-MM-YYYY").startOf("day");
    if (selectedDate.isBefore(currentDate)) {
      return res.status(400).send({
        message: "Cannot book appointments on previous dates",
        success: false,
      });
    }
    if (
      selectedDate.isSame(currentDate) &&
      req.body.time <= moment().format("hh:mm a")
    ) {
      return res.status(400).send({
        message: "Please select upcoming date for appointment",
        success: false,
      });
    }
    const selectedTime = moment(req.body.time, "hh:mm a");
    const doctorId = req.body.doctorId;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).send({
        message: "Doctor not found",
        success: false,
      });
    }
    if (req.body.userId == doctor.userId) {
      return res.status(400).send({
        message: "Can't book appointment with yourself",
        success: false,
      });
    }
    const fromTime = moment(doctor.timings[0], "hh:mm a");
    const toTime = moment(doctor.timings[1], "hh:mm a");

    if (selectedTime.isBefore(fromTime) || selectedTime.isAfter(toTime)) {
      return res.status(200).send({
        message: "Appointment time is outside of doctor's working hours",
        success: false,
      });
    }

    const appointments = await Appointment.find({
      doctorId,
      date: selectedDate.toISOString(),
    });

    const isAvailable = appointments.every((appointment) => {
      const appointmentTime = moment(appointment.time);
      const timeDiff = Math.abs(selectedTime.diff(appointmentTime, "minutes"));
      return timeDiff >= 60; // Check if the time difference is at least 60 minutes (1 hour)
    });

    if (isAvailable) {
      return res.status(200).send({
        message: "Appointment slot available",
        success: true,
      });
    } else {
      return res.status(200).send({
        message: "Appointment slot not available",
        success: false,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error checking appointment availability",
      success: false,
      error,
    });
  }
});

router.get("/get-appointments-by-user-id", authMiddleware, async (req, res) => {
  try {
    let appointments;
    if (!req.query.name) {
      appointments = await Appointment.find({ userId: req.body.userId });
    } else {
      appointments = await Appointment.find({
        userId: req.body.userId,
        "doctorInfo.firstName": { $regex: new RegExp(req.query.name, "i") },
      });
    }
    res.status(200).send({
      message: "Appointments fetched successfully",
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error fetching appointments",
      success: false,
      error,
    });
  }
});
module.exports = router;
