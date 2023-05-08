const mongoose = require("mongoose");
const { schoolModel} = require('./SchoolModels')


//Connect To DB
mongoose.connect("mongodb://localhost/tapin")


const pollSchema = new mongoose.Schema ({
    name: String,
    description: String,
    postedBy: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'School'
    },
    
    firstRepsonse: [{studentID: String, response: Boolean}],
    
    SecondResponse: [{studentID: String, response: Boolean}],
    startDate: String
    

});

let pollModel = mongoose.model("Polls", pollSchema);














module.exports = {
    pollModel
}