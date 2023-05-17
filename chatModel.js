const mongoose = require("mongoose");




//Connect To DB
mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true})

const db = mongoose.connection



//Same classID and same hour, to find a single class.
const requestChatSchema = new mongoose.Schema({
    
    studentID: {type:mongoose.Schema.Types.ObjectId,
        ref:'Student'},
     staffID: {type:mongoose.Schema.Types.ObjectId,
            ref:'Staff'},
            didMeet: Boolean,
            meetDate: String
    
    

   
   
    


    

});


let requestChatModel = mongoose.model("RequestChat", requestChatSchema);


module.exports = {requestChatModel}