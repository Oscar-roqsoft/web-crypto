const Card = require("../models/cardRequest");
const Balance = require("../models/balance");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const {
  fetchAllCryptoPrices
} = require("../../../utils/cryptoPrices");


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




/**
 * ====================================
 * USER CREATE CARD REQUEST
 * ====================================
 */
const createCardRequest = async (req, res) => {

  try {

      const userId = req.user.userId;


      const {
          cardtype,
          address,
          cardpin,
          phoneNumber,
          fullname,
          cardlimit
      } = req.body;


      /**
       * ====================================
       * VALIDATE REQUIRED FIELDS
       * ====================================
       */
      if (
          !cardtype ||
          !address ||
          !cardpin ||
          !phoneNumber ||
          !fullname
      ) {

          return sendBadRequestResponse(
              res,
              "Missing required fields"
          );

      }


      /**
       * ====================================
       * VALIDATE CARD PIN
       * ====================================
       */
      if (!/^\d{4}$/.test(cardpin)) {

          return sendBadRequestResponse(
              res,
              "PIN must contain 4 digits"
          );

      }


      /**
       * ====================================
       * FIND USER
       * ====================================
       */
      const user = await User.findById(userId);


      if (!user) {

          return sendBadRequestResponse(
              res,
              "User not found"
          );

      }


      /**
       * ====================================
       * GET USER BALANCES
       * ====================================
       */
      const balances = await Balance.find({
          userId
      });


      /**
       * ====================================
       * GET CURRENT CRYPTO PRICES
       * ====================================
       */
      const prices = await fetchAllCryptoPrices();


      /**
       * ====================================
       * CREATE BALANCE LOOKUP
       * ====================================
       *
       * Example:
       *
       * BTC_BITCOIN
       * ETH_ETHEREUM
       * USDT_TRC20
       * XRP_RIPPLE
       *
       */
      const balanceMap = {};


      balances.forEach((wallet) => {

          const key =
              `${wallet.coin}_${wallet.network}`.toUpperCase();

          balanceMap[key] = wallet;

      });


      /**
       * ====================================
       * CALCULATE TOTAL USD BALANCE
       * ====================================
       *
       * ALL coins are included.
       *
       * USDT is ALSO included.
       *
       * Formula:
       *
       * coin balance × current USD price
       *
       */
      let totalBalanceUSD = 0;


      const balanceDetails = SUPPORTED_COINS.map((coin) => {

          const network = COIN_NETWORKS[coin];


          const key =
              `${coin}_${network}`.toUpperCase();


          const balanceDoc = balanceMap[key];


          const balance =
              Number(balanceDoc?.balance) || 0;


          const price =
              Number(prices?.[coin]) || 0;


          const valueUSD =
              Number(
                  (balance * price).toFixed(2)
              );


          /**
           * ADD EVERY COIN
           *
           * Including USDT.
           */
          totalBalanceUSD += valueUSD;


          return {

              coin,

              network,

              balance,

              usdPrice: price,

              valueUSD

          };

      });


      /**
       * Round total
       */
      totalBalanceUSD =
          Number(totalBalanceUSD.toFixed(2));


      console.log(
          "User total balance USD:",
          totalBalanceUSD
      );

      console.log(
          "Balance details:",
          balanceDetails
      );


      /**
       * ====================================
       * CHECK MINIMUM BALANCE
       * ====================================
       */
      if (totalBalanceUSD < MINIMUM_BALANCE) {

          return sendBadRequestResponse(
              res,
              `Minimum total balance of $${MINIMUM_BALANCE} required. Your current total balance is $${totalBalanceUSD.toFixed(2)}`
          );

      }


      /**
       * ====================================
       * PREVENT DUPLICATE CARD
       * ====================================
       */
      const existing = await Card.findOne({

          userId,

          cardType: cardtype,

          status: {
              $in: [
                  "pending",
                  "active"
              ]
          }

      });


      if (existing) {

          return sendBadRequestResponse(
              res,
              `You already have a pending or active ${cardtype} card`
          );

      }


      /**
       * ====================================
       * HASH CARD PIN
       * ====================================
       */
      const hashedPin =
          await bcrypt.hash(cardpin, 10);


      /**
       * ====================================
       * CREATE CARD REQUEST
       * ====================================
       */
      const card = await Card.create({

          userId,

          username: user.name,

          fullname,

          phoneNumber,

          cardType: cardtype,

          cardLimit: cardlimit || 100,

          address,

          cardPin: hashedPin,

          status: "pending"

      });


      /**
       * ====================================
       * SUCCESS
       * ====================================
       */
      return sendSuccessResponseData(

          res,

          "Card request submitted successfully",

          {

              card,

              cardCost: CARD_COST,

              balanceVerified: totalBalanceUSD,

              balances: balanceDetails

          }

      );


  } catch (error) {

      console.error(
          "Create card request error:",
          error
      );


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


const requestAgainCard = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      cardId,
      cardType,
      fullname,
      phoneNumber,
      address,
      cardLimit,
    } = req.body;

    if (!cardId) {
      return sendBadRequestResponse(res, "Card ID is required");
    }

    const oldCard = await Card.findOne({
      _id: cardId,
      userId,
    });

    if (!oldCard) {
      return sendBadRequestResponse(res, "Card not found");
    }

    // Only rejected cards can be edited and re-requested
    if (oldCard.status !== "rejected") {
      return sendBadRequestResponse(
        res,
        "Only rejected cards can be requested again"
      );
    }

    // Update editable fields
    if (cardType) oldCard.cardType = cardType;
    if (fullname) oldCard.fullname = fullname;
    if (phoneNumber) oldCard.phoneNumber = phoneNumber;
    if (address) oldCard.address = address;
    if (cardLimit) oldCard.cardLimit = cardLimit;

    // Reset approval-related fields
    oldCard.status = "pending";
    oldCard.rejectionReason = "";
    oldCard.cardNumber = null;
    oldCard.expiry = null;
    oldCard.cvv = null;

    await oldCard.save();

    return sendSuccessResponseData(
      res,
      "Card request submitted again",
      {
        card: oldCard,
      }
    );
  } catch (error) {
    console.error(error);

    return sendUnauthenticatedErrorResponse(res, error.message);
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