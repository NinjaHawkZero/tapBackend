const mongoose = require("mongoose");




//Connect To DB
mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true})

const db = mongoose.connection




const tapInSchema = new mongoose.Schema({
    student: {type:mongoose.Schema.Types.ObjectId,
        ref:'Student'},
    //Date Format: Mon Feb 20 2023
    date: String,
    reviewedBy: String,
    flagged: Boolean,
    tapInCompleted: Boolean,
    eating:  Boolean,
    sleeping:  Boolean,
    wellBeing:  Boolean

});



let tapInModel = mongoose.model("TapIns", tapInSchema);









module.exports = {tapInModel}