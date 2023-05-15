const mongoose = require("mongoose");
const {default: tapInModel} = require('./TapInModel')
const {default: schoolModel} = require("./SchoolModels")


//Connect To DB
mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true})
const db = mongoose.connection



const studentSchema = new mongoose.Schema({
    name: String,
    hrt: {type: mongoose.Schema.Types.ObjectId, ref: 'Staff'},
    email: String,
    counselor: {type: mongoose.Schema.Types.ObjectId, ref: 'Staff'},
    passcode: String,
    schoolID: {type:mongoose.Schema.Types.ObjectId,
        ref:'School'},
    grade: String,
    flagged: Boolean

      
     
   
   
   
   
  
 
   
    
   


//Two types of tapIn's numbers and booleans.  Will switch at random.  If it's a number that means it works on a scale, if it's boolean, it's true or false.


});

let studentModel = mongoose.model("Student", studentSchema); 




    



module.exports = {
    studentModel
}