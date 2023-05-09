const mongoose = require("mongoose");



//Connect To DB
mongoose.connect("mongodb://localhost/tapin2")


const questionSchema = new mongoose.Schema ({
    name: String
    
    

});

let questionModel = mongoose.model("Questions", questionSchema);














module.exports = {
    questionModel
}