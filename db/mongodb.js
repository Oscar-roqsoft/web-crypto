// const mongoose = require('mongoose')
// // mongoose.set("bufferCommands", false);

// const connectDB = async (url) => {
//   return await mongoose.connect(url, {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useFindAndModify: false,
//     useUnifiedTopology: true,
//   }) .then(() => console.log("Connected to MongoDB"))
//     .catch((err) => console.log(err));
// }

// module.exports = connectDB

const mongoose = require('mongoose')

const connectDB = async (url) => {
  try {
    await mongoose.connect(url);

    console.log("MongoDB connected");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB