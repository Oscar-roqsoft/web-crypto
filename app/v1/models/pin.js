const mongoose = require("mongoose");

const pinSchema = new mongoose.Schema({
    pin:{
        type:String,
        required: true,
        select:false     // hide PIN from queries for security
    },
  createdBy: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });


pinSchema.methods.setPin = async function(pin){

    const salt = await bcrypt.genSalt(10)
  
    // Store hashed PIN
    const hashpin = await bcrypt.hash(pin,salt)
  
    return hashpin
  
}

module.exports = mongoose.model("Size", pinSchema);