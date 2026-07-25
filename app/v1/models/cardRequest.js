const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
{
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    username:{
        type:String,
        default:""
    },

    fullname:{
        type:String,
        required:true
    },

    phoneNumber:{
        type:String,
        required:true
    },


    cardType:{
        type:String,
        enum:["gold card","black card"],
        required:true
    },


    cardNumber:{
        type:String,
        default:null
    },


    expiry:{
        type:String,
        default:null
    },


    cvv:{
        type:String,
        default:null
    },


    cardLimit:{
        type:Number,
        default:100
    },


    balance:{
        type:Number,
        default:0
    },


    address:{
        type:String,
        required:true
    },


    cardPin:{
        type:String,
        required:true
    },


    status:{
        type:String,
        enum:[
            "pending",
            "active",
            "blocked",
            "rejected"
        ],
        default:"pending"
    },


    rejectionReason:{
        type:String,
        default:""
    },


    funded:{
        type:Boolean,
        default:false
    }

},
{
    timestamps:true
});


module.exports = mongoose.model(
    "Card",
    cardSchema
);