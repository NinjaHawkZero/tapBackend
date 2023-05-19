const mongoose = require("mongoose");
const { default: PollModel } = require("./PollModel");
const bcrypt = require("bcrypt")


const { BCRYPT_WORK_FACTOR } = require("./config")
//Connect To DB
mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true})
const db = mongoose.connection


//Create Schema
const schoolSchema = new mongoose.Schema(
    
    {
    
    schoolName: String,
    schoolCode: String,
    adminTitle: String,
    adminName: String,
    password: String,
    googleId: String,
    staff:[{type: mongoose.Schema.Types.ObjectId,ref:'Staff'}],
    students:[{type: mongoose.Schema.Types.ObjectId,ref:'Student'}],
    polls:[{type: mongoose.Schema.Types.ObjectId,ref:'Polls'}]
    

}

)

let schoolModel =  mongoose.model("School", schoolSchema);





  


    


    module.exports =  {schoolModel, db }