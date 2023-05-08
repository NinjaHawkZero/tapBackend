const mongoose = require("mongoose");
const {default: schoolModel} = require("./SchoolModels")



//Connect To DB
mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true})

const db = mongoose.connection




const staffSchema = new mongoose.Schema({
    schoolID: {type:mongoose.Schema.Types.ObjectId,
        ref:'School'},
    schoolCode: String,
    name: String,
    email: String,
    password: String,
    title: String,
    
    //Classes are an array of student ids for the students in each class
   

});


let staffModel = mongoose.model("Staff", staffSchema);





             



module.exports = {staffModel}