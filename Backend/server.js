const express = require("express");
const app = express();
require("dotenv").config();
const dbConfig = require("./config/dbConfig");
app.use(express.json());
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const doctorRoute = require("./routes/doctorsRoute");
// const blogRoute = require("./routes/blogRoute");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");

const path = require("path");

app.use("/api/user", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/doctor", doctorRoute);
// app.use("/api/blogs", blogRoute);

// if (process.env.NODE_ENV === "production") {
//   app.use("/", express.static("client/build"));

//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "client/build/index.html"));
//   });
// }

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Route to handle form submission and send email
app.post("/api/send-email", (req, res) => {
  const { name, email, phoneNumber, description } = req.body;

  // Create a transporter using your email provider's SMTP settings
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'name.kirlin@ethereal.email',
        pass: 'XfB1M216dzYaXU7hzJ'
    }
});

  // Compose the email message
  const mailOptions = {
    from: "your-email@example.com",
    to: "recipient@example.com",
    subject: "New Contact Form Submission",
    text: `
      Name: ${name}
      Email: ${email}
      Phone Number: ${phoneNumber}
      Description: ${description}
    `,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send("Error sending email");
    } else {
      console.log("Email sent:", info.response);
      res.status(200).send("Email sent successfully");
    }
  });
});
const port = process.env.PORT || 5000;

app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Node Express Server Started at ${port}!`));
