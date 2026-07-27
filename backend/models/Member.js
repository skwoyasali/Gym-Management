const mongoose=require("mongoose");


const memberSchema=new mongoose.Schema({


name:String,


phone:String,


email:String,


plan:{
type:String,
default:"Monthly"
},


joinDate:{
type:Date,
default:Date.now
},


expiryDate:Date,


active:{
type:Boolean,
default:true
}


});


module.exports =
mongoose.model(
"Member",
memberSchema
);