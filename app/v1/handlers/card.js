const Card = require("../models/cardRequest");
const Balance = require("../models/balance");
const User = require("../models/user");
const bcrypt = require("bcryptjs");


const {
 sendSuccessResponse,
 sendSuccessResponseData,
 sendBadRequestResponse,
 sendUnauthenticatedErrorResponse
}=require("../responses");



const MINIMUM_BALANCE = 5000;
const CARD_COST = 20;



const generateCardNumber = ()=>{

 return "4" +
 Math.floor(
  100000000000000 +
  Math.random()*900000000000000
 );

};



const generateExpiry = ()=>{

 const year =
 new Date().getFullYear()+3;

 return `12/${String(year).slice(-2)}`;

};



const generateCVV = ()=>{

 return Math.floor(
 100+Math.random()*900
 ).toString();

};




/*
====================================
 USER CREATE CARD REQUEST
====================================
*/

const createCardRequest = async(req,res)=>{

try{


const userId=req.user.userId;


const {
 cardtype,
 address,
 cardpin,
 phoneNumber,
 fullname,
 cardlimit
}=req.body;



if(
 !cardtype ||
 !address ||
 !cardpin ||
 !phoneNumber ||
 !fullname
){

return sendBadRequestResponse(
res,
"Missing required fields"
);

}



if(!/^\d{4}$/.test(cardpin)){

return sendBadRequestResponse(
res,
"PIN must contain 4 digits"
);

}




const user =
await User.findById(userId);



if(!user){

return sendBadRequestResponse(
res,
"User not found"
);

}




/*
CHECK USER TOTAL BALANCE
*/


const balances =
await Balance.find({
userId
});



let totalUSD = 0;



balances.forEach(wallet=>{


if(wallet.coin==="USDT"){

 totalUSD += wallet.balance;

}

});




if(totalUSD < MINIMUM_BALANCE){

return sendBadRequestResponse(
res,
`Minimum balance of $${MINIMUM_BALANCE} required`
);

}




// prevent duplicate pending card

const existing =
await Card.findOne({
 userId,
 status:{
  $in:[
   "pending",
   "active"
  ]
 }
});


if(existing){

return sendBadRequestResponse(
res,
"You already have an active or pending card"
);

}



const hashedPin =
await bcrypt.hash(cardpin,10);



const card =
await Card.create({

userId,

username:user.name,

fullname,

phoneNumber,

cardType:cardtype,

cardLimit:cardlimit || 100,

address,

cardPin:hashedPin,

status:"pending"


});





return sendSuccessResponseData(
res,
"Card request submitted successfully",
{

card,

cardCost:CARD_COST,

balanceVerified:totalUSD

}

);



}catch(error){

console.log(error);

return sendUnauthenticatedErrorResponse(
res,
error.message
);

}

};





/*
====================================
GET USER CARDS
====================================
*/


const getMyCards = async(req,res)=>{

try{


const cards =
await Card.find({
userId:req.user.userId
})
.sort({
createdAt:-1
});



return sendSuccessResponseData(
res,
"Cards fetched",
{
cards
}
);



}catch(error){

return sendUnauthenticatedErrorResponse(
res,
error.message
);

}

};





/*
====================================
ADMIN GET ALL CARDS
====================================
*/


const getAllCards = async(req,res)=>{

try{


const cards =
await Card.find()
.populate(
"userId",
"name email"
)
.sort({
createdAt:-1
});



return sendSuccessResponseData(
res,
"All cards",
{
cards
}
);



}catch(error){

return sendUnauthenticatedErrorResponse(
res,
error.message
);

}

};






/*
====================================
ADMIN APPROVE CARD
====================================
*/


const approveCard = async(req,res)=>{


try{


const {
cardId
}=req.body;



const card =
await Card.findById(cardId);



if(!card)
return sendBadRequestResponse(
res,
"Card not found"
);



if(card.status==="active")
return sendBadRequestResponse(
res,
"Card already active"
);



card.cardNumber =
generateCardNumber();


card.expiry =
generateExpiry();


card.cvv =
generateCVV();



card.status="active";



await card.save();



return sendSuccessResponse(
res,
"Card approved successfully"
);



}catch(error){

return sendUnauthenticatedErrorResponse(
res,
error.message
);

}


};






/*
====================================
ADMIN REJECT CARD
====================================
*/


const rejectCard = async(req,res)=>{


try{


const {
cardId,
reason
}=req.body;



const card =
await Card.findById(cardId);



if(!card)
return sendBadRequestResponse(
res,
"Card not found"
);



card.status="rejected";

card.rejectionReason =
reason || "Rejected by admin";



await card.save();



return sendSuccessResponse(
res,
"Card rejected"
);



}catch(error){

return sendUnauthenticatedErrorResponse(
res,
error.message
);

}


};







/*
====================================
ADMIN FUND CARD
====================================
*/


const fundCard = async(req,res)=>{


try{


const {
cardId,
amount
}=req.body;



if(!amount || amount<=0){

return sendBadRequestResponse(
res,
"Invalid amount"
);

}



const card =
await Card.findById(cardId);



if(!card){

return sendBadRequestResponse(
res,
"Card not found"
);

}



if(card.status!=="active"){

return sendBadRequestResponse(
res,
"Card is not active"
);

}



card.balance += Number(amount);



card.funded=true;


await card.save();



return sendSuccessResponseData(
res,
"Card funded successfully",
{
balance:card.balance
}
);



}catch(error){

return sendUnauthenticatedErrorResponse(
res,
error.message
);

}


};






/*
====================================
BLOCK CARD
====================================
*/


const blockCard = async(req,res)=>{


try{


const {
cardId
}=req.body;



const card =
await Card.findById(cardId);



if(!card){

return sendBadRequestResponse(
res,
"Card not found"
);

}



card.status="blocked";


await card.save();



return sendSuccessResponse(
res,
"Card blocked successfully"
);



}catch(error){

return sendUnauthenticatedErrorResponse(
res,
error.message
);

}


};






/*
====================================
RE-REQUEST REJECTED CARD
====================================
*/


const requestAgainCard = async(req,res)=>{


try{


const {
cardId
}=req.body;



const oldCard =
await Card.findById(cardId);



if(!oldCard){

return sendBadRequestResponse(
res,
"Card not found"
);

}



if(oldCard.status!=="rejected"){

return sendBadRequestResponse(
res,
"Only rejected cards can be requested again"
);

}



oldCard.status="pending";
oldCard.rejectionReason="";

await oldCard.save();



return sendSuccessResponse(
res,
"Card request submitted again"
);



}catch(error){

return sendUnauthenticatedErrorResponse(
res,
error.message
);

}

};




module.exports={

createCardRequest,

getMyCards,

getAllCards,

approveCard,

rejectCard,

fundCard,

blockCard,

requestAgainCard

};