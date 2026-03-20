// Import required packages
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

// Create the User schema
const UserSchema = new mongoose.Schema({

  // User full name
  name:{
    type:String,
    required:true,          // name must be provided
    minlength:3,            // minimum 3 characters
    maxlength:50            // maximum 50 characters
  },

   avatar: {
    type: String,
    maxlength: [80, 'Name cannot exceed 50 characters'],
    minlength: [1, 'Name must be at least 3 characters'],
  },

  // User email address
  email:{
    type:String,
    required:true,
    unique:true,            // no two users can have the same email
    lowercase:true          // automatically convert email to lowercase
  },

  // User login password
  password:{
    type:String,
    required:true,
    minlength:6,            // strong password minimum length
    select:false            // password will NOT be returned in queries unless explicitly selected
  },

  // Optional phone number
  phone:{
    type:String,
    // maxlength: [20, 'Name cannot exceed 50 characters'],
    // minlength: [1, 'Name must be at least 3 characters'],
  },

   // User country (for region restrictions, KYC, etc.)
   country:{
    type:String,
    required:true
  },

  // User profile picture/avatar
  avatar:{
    type:String,
    default:null
  },

  // Email verification status
  isVerified:{
    type:Boolean,
    default:true
  },

  // Security PIN used for sensitive operations
  pin:{
    type:String,
    select:false     // hide PIN from queries for security
  },

  isPinSet:{
    type:Boolean,
    default:false
  },

  // User wallet address (for crypto deposits)
  walletAddress:{
    type:String,
    unique:true
  },

  // User crypto balances
  balances: {
    BTC: { type: Number, default: 0 },
    ETH: { type: Number, default: 0 },
    USDT: { type: Number, default: 0 },
    TRX: { type: Number, default: 0 },
    SOL: { type: Number, default: 0 },
    XRP: { type: Number, default: 0 },
    XLM: { type: Number, default: 0 },
    ADA: { type: Number, default: 0 }
  
  },

  // User role (for admin control)
  role:{
    type:String,
    enum:["user","admin"],  // allowed values
    default:"user"
  }

},{
  timestamps:true            // automatically adds createdAt and updatedAt
})


// ------------------------------------------------------
// MIDDLEWARE: Hash password before saving to database
// ------------------------------------------------------
UserSchema.pre("save", async function(next){

  // Only hash password if it was modified
  if(!this.isModified("password")) return next()

  // Generate salt
  const salt = await bcrypt.genSalt(10)

  // Hash password
  this.password = await bcrypt.hash(this.password,salt)

  next()

})


// MIDDLEWARE: Hash pin before saving to database
// ------------------------------------------------------
// UserSchema.pre("saveWithHashPin", async function(next){

//   // Only hash pin if it was modified
//   if(!this.isModified("pin")) return next()

//   // Generate salt
//   const salt = await bcrypt.genSalt(10)

//   // Hash pin
//   this.pin = await bcrypt.hash(this.pin,salt)

//   next()

// })


// ------------------------------------------------------
// METHOD: Set or update user PIN (hashed for security)
// ------------------------------------------------------
UserSchema.methods.setPin = async function(pin){

  const salt = await bcrypt.genSalt(10)

  // Store hashed PIN
  const hashpin = await bcrypt.hash(pin,salt)

  return hashpin

}


// ------------------------------------------------------
// METHOD: Create JWT authentication token
// ------------------------------------------------------
UserSchema.methods.createJWT = function(){

  return jwt.sign(
    {
      userId:this._id,     // user ID stored in token
      email:this.email     // user email stored in token
    },
    process.env.JWT_SECRET, // secret key from environment variables
    { expiresIn:"30d" }     // token expires in 30 days
  )

}


// ------------------------------------------------------
// METHOD: Compare login password with stored hashed password
// ------------------------------------------------------
UserSchema.methods.comparePassword = async function(password){

  return await bcrypt.compare(password,this.password)

}


UserSchema.methods.comparePin = async function(pin){

  return await bcrypt.compare(pin,this.pin)

}


// Export the model
module.exports = mongoose.model("User",UserSchema)