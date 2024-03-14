const express = require("express");
const router = express.Router();

const stripe = require("stripe")(process.env.STRIPE_KEY);

const Doctor = require("../models/doctorModel");
const authMiddleware = require("../middlewares/authMiddleware");
const Appointment = require("../models/appointmentModel");
const User = require("../models/userModel");

router.post("/get-doctor-info-by-user-id", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.body.userId });
    res.status(200).send({
      success: true,
      message: "Doctor info fetched successfully",
      data: doctor,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting doctor info", success: false, error });
  }
});

router.post("/get-doctor-info-by-id", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ _id: req.body.doctorId });
    res.status(200).send({
      success: true,
      message: "Doctor info fetched successfully",
      data: doctor,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting doctor info", success: false, error });
  }
});

router.post("/update-doctor-profile", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.body.userId },
      req.body
    );
    res.status(200).send({
      success: true,
      message: "Doctor profile updated successfully",
      data: doctor,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting doctor info", success: false, error });
  }
});

router.get(
  "/get-appointments-by-doctor-id",
  authMiddleware,
  async (req, res) => {
    try {
      let appointments;
      const doctor = await Doctor.findOne({ userId: req.body.userId });
      if (!req.query.name) {
        appointments = await Appointment.find({ doctorId: doctor._id });
      } else {
        appointments = await Appointment.find({
          doctorId: doctor._id,
          "userInfo.name": { $regex: new RegExp(req.query.name, "i") },
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
  }
);

// ........................nichy wala code ok ha....................

router.post("/change-appointment-status", authMiddleware, async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    if (status === "rejected") {
      const appointmentdoc = await Appointment.findById(appointmentId);
      const refund = await stripe.refunds.create({
        charge: appointmentdoc.appointmentPaymentId,
      });
      req.body.refunded = true;
    }
    const appointment = await Appointment.findByIdAndUpdate(appointmentId, {
      status,
      refunded: req.body.refunded ? true : false,
    });

    const user = await User.findOne({ _id: appointment.userId });
    const unseenNotifications = user.unseenNotifications;
    unseenNotifications.push({
      type: "appointment-status-changed",
      message: `Your appointment status has been ${status} with Dr. ${appointment.doctorInfo.firstName} ${appointment.doctorInfo.lastName} ${status === "rejected"? "And full amount is refunded":""}`,
      onClickPath: "/appointments",
    });

    await user.save();

    res.status(200).send({
      message: "Appointment status updated successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error changing appointment status",
      success: false,
      error,
    });
  }
});

// nechay wala for testing

// router.post("/change-appointment-status", async (req, res) => {
//   const { appointmentId, status } = req.body;

//   try {
//     // Update appointment status in the database
//     const appointment = await Appointment.findById(appointmentId);
//     if (!appointment) {
//       return res.status(404).json({ success: false, message: "Appointment not found" });
//     }

//     appointment.status = status;
//     await appointment.save();

//     // Send email notification
//     const email = appointment.userInfo.email;
//     sendEmailNotification(email, status);

//     return res.status(200).json({ success: true, message: "Appointment status changed" });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// });

// const sendEmailNotification = (email, status) => {
//   const mailOptions = {
//     from: "clifton98@ethereal.email",
//     to: email,
//     subject: "Appointment Status Update",
//     text: `Your appointment status has been changed to ${status}.`,
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.log("Error sending email", error);
//     } else {
//       console.log("Email sent", info.response);
//     }
//   });
// };

module.exports = router;
