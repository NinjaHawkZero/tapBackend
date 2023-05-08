require('dotenv').config()

const express = require("express");
const app = express();

const mongoose = require("mongoose")
const {PORT} = require("./config");
const { pollModel } = require("./PollModel")
const { questionModel } = require("./QuestionModel")


//process.env.DATABASE_URL
mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true})

const db = mongoose.connection


db.on('error', (error) => console.error(error))

db.once('open', () => console.log("Connected To Database"))




app.use(express.json())



  









   

function profit(prices) {
    let max_profit = -1000
    let min_price = prices[0]
    for(let val of prices) {
        if (val < min_price ){
            min_price = val
        } else
        {
            profit = val - min_price
            if(profit > max_profit) {
                max_profit = profit
            }
        }
    }

    return max_profit
}
    





// //Post poll questions to DB
// async function questions() {
    
//     try{
//         //PollQuestion is an object {name:"Question"}
//       let created =  questionsObj.map( async function(ques) {

//           var newQuestion = await questionModel.create(ques)

//             await newQuestion.save()

//             console.log(newQuestion)
          
//             return newQuestion
//         })


       

        
//     }

//     catch(err) {
//         { err.message}
//     }





// };
// questions()


// let questionsObj = [
//     {name: "Do you prefer fish sticks or chicken nuggets?"},
//     {name: "Do you prefer to use crayons or colored pencils?"},
//     {name: "Would you rather play tag or hopscotch?"},
//     {name: "Would you rather have an individual or group classroom job?"},
//     {name: "Do you prefer cupcakes or brownies?"},
//     {name: "Are you more interested in football or basketball?"},
//     {name: "Do hamsters or rabbits make better pets?"},
//     {name: "Would you rather have as a superpower the ability to be invisible or the ability to fly?"},
//     {name: "What’s more delicious…an ice sandwich or cookies?"},
//     {name: "Do you prefer Field Day or taking a field trip?"},
//     {name: "Would you rather play with Legos or play a board game?"},
//     {name: "Are you more interested in art or P.E class?"},
//     {name: "Do you like more fruits or vegetables?"},
//     {name: "Do you prefer recess in the morning or afternoon?"},
//     {name: "Are you more likely to make a phone call or send a text message?"},
//     {name: "Do you like breakfast or lunch foods best?"}
// ]




const schoolRouter = require('./routes/schoolRoutes')
app.use('/schoolRoutes', schoolRouter)

const staffRouter = require('./routes/staffRoutes')
app.use('/staffRoutes', staffRouter)


const studentRouter = require('./routes/studentRoutes')
app.use('/studentRoutes', studentRouter)

const tapInRouter = require('./routes/tapInRoutes')
app.use('/tapInRoutes', tapInRouter)


const pollRouter = require('./routes/pollRoutes')
app.use('/pollRoutes', pollRouter)

app.listen(PORT, process.env.IP, function() {
    console.log("The tapIn server has started!")
})