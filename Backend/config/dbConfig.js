const mongoose = require('mongoose');
// Define the URI to your MongoDB database
const uri = 'mongodb+srv://eclinic:1234@cluster0.8f8lm5l.mongodb.net/?retryWrites=true&w=majority';
// Connect to the MongoDB database using Mongoose
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected...'))
.catch(err => console.log(err));

module.exports = mongoose;
