const mongoose = require("mongoose");
const {default: staffModel} = require("./StaffModel")



//Connect To DB
mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true})

const db = mongoose.connection



//Same classID and same hour, to find a single class.
const classSchema = new mongoose.Schema({
    staffID: {type:mongoose.Schema.Types.ObjectId,
        ref:'Staff'},
    schoolID: {type:mongoose.Schema.Types.ObjectId,
        ref:'School'},
    className: String,
    //firstHour, secondHour, thirdHour
    hour: String

   
   
    


    

});


let classModel = mongoose.model("Class", classSchema);


module.exports = {classModel}