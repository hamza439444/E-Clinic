const express = require("express");
const router = express.Router();
const moment = require("moment");
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const Appointment = require("../models/appointmentModel");
const authMiddleware = require("../middlewares/authMiddleware");

router.get(
  "/get-appointments-by-doctor-id",
  authMiddleware,
  async (req, res) => {
    try {
      const doctor = await Doctor.findOne({ userId: req.body.userId });
      const appointments = await Appointment.find({ doctorId: doctor._id });
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
router.post("/change-appointment-status", authMiddleware, async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(appointmentId, {
      status,
    });

    const user = await User.findOne({ _id: appointment.userId });
    const unseenNotifications = user.unseenNotifications;
    unseenNotifications.push({
      type: "appointment-status-changed",
      message: `Your appointment status has been ${status}`,
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

router.get("/get-all-doctors", authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({});
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

router.get("/get-all-users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).send({
      message: "Users fetched successfully",
      success: true,
      data: users,
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
  "/change-doctor-account-status",
  authMiddleware,
  async (req, res) => {
    try {
      const { doctorId, status } = req.body;
      const doctor = await Doctor.findByIdAndUpdate(doctorId, {
        status,
      });

      const user = await User.findOne({ _id: doctor.userId });
      const unseenNotifications = user.unseenNotifications;
      unseenNotifications.push({
        type: "new-doctor-request-changed",
        message: `Your doctor account has been ${status}`,
        onClickPath: "/notifications",
      });
      user.isDoctor = status === "approved" ? true : false;
      await user.save();

      res.status(200).send({
        message: "Doctor status updated successfully",
        success: true,
        data: doctor,
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

router.get("/get-stats", async (req, res) => {
  try {
    const stats = await Appointment.aggregate([
      {
        $match: {
          updatedAt: {
            $gte: new Date(req.query.selectedDateRange[0]),
            $lte: new Date(req.query.selectedDateRange[1]),
          },
          status: "approved",
        },
      },
      {
        $group: {
          _id: "$doctorId",
          // documents: { $first: "$$ROOT" },
          doctorInfo: { $first: "$doctorInfo" },
          users: { $push: "$userInfo.name" },
          dates: { $push: "$date" },
          times: { $push: "$time" },
          numAppointments: { $sum: 1 },
          totalEarnings: { $sum: "$doctorInfo.feePerCunsultation" },
        },
      },
    ]);

    // const users = await User.find({});
    res.status(200).send({
      message: "Stats fetched successfully",
      success: true,
      results: stats.length,
      data: stats,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Something went wrong, Please try again later",
      success: false,
      error,
    });
  }
});

module.exports = router;






















































// const express = require("express");
// const router = express.Router();
// const moment = require("moment");
// const User = require("../models/userModel");
// const Doctor = require("../models/doctorModel");
// const Appointment = require("../models/appointmentModel");
// const authMiddleware = require("../middlewares/authMiddleware");

// router.get(
//   "/get-appointments-by-doctor-id",
//   authMiddleware,
//   async (req, res) => {
//     try {
//       const doctor = await Doctor.findOne({ userId: req.body.userId });
//       const appointments = await Appointment.find({ doctorId: doctor._id });
//       res.status(200).send({
//         message: "Appointments fetched successfully",
//         success: true,
//         data: appointments,
//       });
//     } catch (error) {
//       console.log(error);
//       res.status(500).send({
//         message: "Error fetching appointments",
//         success: false,
//         error,
//       });
//     }
//   }
// );
// router.post("/change-appointment-status", authMiddleware, async (req, res) => {
//   try {
//     const { appointmentId, status } = req.body;
//     const appointment = await Appointment.findByIdAndUpdate(appointmentId, {
//       status,
//     });

//     const user = await User.findOne({ _id: appointment.userId });
//     const unseenNotifications = user.unseenNotifications;
//     unseenNotifications.push({
//       type: "appointment-status-changed",
//       message: `Your appointment status has been ${status}`,
//       onClickPath: "/appointments",
//     });

//     await user.save();

//     res.status(200).send({
//       message: "Appointment status updated successfully",
//       success: true,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       message: "Error changing appointment status",
//       success: false,
//       error,
//     });
//   }
// });

// router.get("/get-all-doctors", authMiddleware, async (req, res) => {
//   try {
//     const doctors = await Doctor.find({});
//     res.status(200).send({
//       message: "Doctors fetched successfully",
//       success: true,
//       data: doctors,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       message: "Error applying doctor account",
//       success: false,
//       error,
//     });
//   }
// });

// router.get("/get-all-users", authMiddleware, async (req, res) => {
//   try {
//     const users = await User.find({});
//     res.status(200).send({
//       message: "Users fetched successfully",
//       success: true,
//       data: users,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       message: "Error applying doctor account",
//       success: false,
//       error,
//     });
//   }
// });

// router.post(
//   "/change-doctor-account-status",
//   authMiddleware,
//   async (req, res) => {
//     try {
//       const { doctorId, status } = req.body;
//       const doctor = await Doctor.findByIdAndUpdate(doctorId, {
//         status,
//       });

//       const user = await User.findOne({ _id: doctor.userId });
//       const unseenNotifications = user.unseenNotifications;
//       unseenNotifications.push({
//         type: "new-doctor-request-changed",
//         message: `Your doctor account has been ${status}`,
//         onClickPath: "/notifications",
//       });
//       user.isDoctor = status === "approved" ? true : false;
//       await user.save();

//       res.status(200).send({
//         message: "Doctor status updated successfully",
//         success: true,
//         data: doctor,
//       });
//     } catch (error) {
//       console.log(error);
//       res.status(500).send({
//         message: "Error applying doctor account",
//         success: false,
//         error,
//       });
//     }
//   }
// );

// router.get("/get-stats", async (req, res) => {
//   try {
//     const stats = await Appointment.aggregate([
//       {
//         $match: {
//           updatedAt: {
//             $gte: new Date(req.query.selectedDateRange[0]),
//             $lte: new Date(req.query.selectedDateRange[1]),
//           },
//           status: "approved",
//         },
//       },
//       {
//         $group: {
//           _id: "$doctorId",
//           nechay wali line comment hai 
//           documents: { $first: "$$ROOT" },
//           doctorInfo: { $first: "$doctorInfo" },
//           users: { $push: "$userInfo.name" },
//           dates: { $push: "$date" },
//           times: { $push: "$time" },
//           numAppointments: { $sum: 1 },
//           totalEarnings: { $sum: "$doctorInfo.feePerCunsultation" },
//         },
//       },
//     ]);
//     nechay wali line comment hai
//     const users = await User.find({});
//     res.status(200).send({
//       message: "Stats fetched successfully",
//       success: true,
//       results: stats.length,
//       data: stats,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       message: "Something went wrong, Please try again later",
//       success: false,
//       error,
//     });
//   }
// });

// module.exports = router;

