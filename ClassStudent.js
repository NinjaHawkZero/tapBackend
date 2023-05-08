const mongoose = require("mongoose");




//Connect To DB
mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true})

const db = mongoose.connection



//Same classID and same hour, to find a single class.
const classStudentSchema = new mongoose.Schema({
    classID: {type:mongoose.Schema.Types.ObjectId,
        ref:'Class'},
    studentID: {type:mongoose.Schema.Types.ObjectId,
        ref:'Student'},
     staffID: {type:mongoose.Schema.Types.ObjectId,
            ref:'Staff'}
    
    

   
   
    


    

});


let classStudentModel = mongoose.model("ClassStudent", classStudentSchema);


module.exports = {classStudentModel}