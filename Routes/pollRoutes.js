const express = require('express')
const router = express.Router()
const { pollModel } = require("../PollModel")
const { questionModel } = require("../QuestionModel");
const { ExpressError } = require('../expressError');

//Getting All polls for a school
router.get('/:_id/getAll', async (req, res) => {

    try{
        let schoolID = req.params._id
        let foundPolls = await pollModel.find({postedBy: schoolID})
        res.statusCode(201).json(foundPolls)
    }

    catch(err) {
        res.statusCode(400).json({message: err.message})

    }
    
    });
    



//Get question for poll
router.get('/getQuestion', async (req, res)  => {
    try
    {
        let question = await questionModel.find();
        
        res.status(201).json(question)

    }

    catch(err) {
        res.status(400).json({message: err.message})
    }
})

    



    //Generate poll for the day, Check if one already exists for school/todaysDate, if so, return that instead
router.get('/:_id/makePoll', async (req, res) => {

        try{
            //Grab schoolID
            let postedBy = req.params._id

            //today's Date
            let todayDate  = assignCurrentDate()

            let foundPoll = await pollModel.find({postedBy: postedBy, dateCreated: todayDate})

            if(foundPoll.length > 0) {


                let poll = foundPoll[0];

                res.status(201).json(poll)
            }


            else {
            //Generate Question
            let question = await questionModel.find()

            //Create Poll
            let poll = await pollModel.create({name: question, postedBy: postedBy, dateCreated: assignCurrentDate() })

           let savedPoll = await poll.save()

            res.status(201).json(savedPoll)
        }

        }

        catch(err) {
            res.status(400).json({message: err.message})
        }

  




    });
    
    


//Return poll with response data, save to DB
    router.post(`/:_id/pollResponse`, async (req, res) => {
        try {

            let pollWithStudentResponse = req.body

            let savedPoll = await pollModel.findOneAndUpdate({type:poll._id}, pollWithStudentResponse, {new: true})

            res.status(201).json(savedPoll)

        }

        catch(err) {

            res.status(400).json({message: err.message})

        }
    })








//Calculate Poll Data

router.get(`/:_id/pollData`, async (req, res) => {
    try
    {
        
        let schoolID = req.params._id;
        let foundPoll = await pollModel.find({postedBy: schoolID, startDate: assignCurrentDate()});

        if(foundPoll.length > 0) {
            
            //Calculate Poll Data

           let totalResponses =  foundPoll[0].yesRepsonse.length + foundPoll[0].noResponse.length;
           let totalYes =(foundPoll[0].yesRepsonse.length / totalResponses) * 100;
           let totalNo = (foundPoll[0].noResponse.length / totalResponses) * 100;

           res.status(201).json([{totalYes: totalYes, totalNo: totalNo}])

        }

        else {
            return res.statusCode(404).json({message: "Cannot find poll"})
        }

    }

    catch(err)
    {
        res.status(400).json({message: err.message})
    }
}) 




//Get today's poll

router.get('/:_id/getToday', async (req, res) => {

    try{
        let schoolID = req.params._id
        let foundPoll = await pollModel.find({postedBy: schoolID, startDate: assignCurrentDate()})
        res.status(201).json(foundPoll)
    }

    catch(err) {
        res.status(400).json({message: err.message})

    }
    
    });




    //Post poll questions to DB
   router.get( `/questions`, async (req, res) => {
    
        try{

            let questionObj = [
                {name: "Do you prefer fish sticks or chicken nuggets?"},
                {name: "Do you prefer to use crayons or colored pencils?"},
                {name: "Would you rather play tag or hopscotch?"},
                {name: "Would you rather have an individual or group classroom job?"},
                {name: "Do you prefer cupcakes or brownies?"},
                {name: "Are you more interested in football or basketball?"},
                {name: "Do hamsters or rabbits make better pets?"},
                {name: "Would you rather have as a superpower the ability to be invisible or the ability to fly?"},
                {name: "What’s more delicious…an ice sandwich or cookies?"},
                {name: "Do you prefer Field Day or taking a field trip?"},
                {name: "Would you rather play with Legos or play a board game?"},
                {name: "Are you more interested in art or P.E class?"},
                {name: "Do you like more fruits or vegetables?"},
                {name: "Do you prefer recess in the morning or afternoon?"},
                {name: "Are you more likely to make a phone call or send a text message?"},
                {name: "Do you like breakfast or lunch foods best?"}
            ]
            //PollQuestion is an object {name:"Question"}
            questionObj.map( async function(ques) {

              var newQuestion = await questionModel.create(ques)

              var saved = await newQuestion.save()
              console.log(saved)
            })


           

            
        }

        catch(err) {
            { err.message}
        }




    
    });


   
   
    






















    





    
    //Updating one
    router.patch('/:id', getPoll, async (req, res) => {
      


        try{
            const updatedPoll = await res.poll.save()
            res.json(updatedPoll)
        }

        catch(err) {
            res.statusCode(400).json({message: err.message})
        }

    
    
    
    })
    
    //Delete one
    router.delete('/:id', getPoll, async (req, res) => {

        try{
            await res.poll.remove()
            res.json({message: "Deleted Poll"})
        }

        catch(err) {
            res.status(400).json({message: err.message})
        }
    
    
    })


    async function getPoll(req, res, next) {
        let poll;

        try{
            poll = await pollModel.findById(req.params.id);
            if(poll == null) {
                return res.statusCode(404).json({message: "Cannot find poll"})
            }
        }

        catch(err) {
            return res.statusCode(500).json({message: err.message})
        }

        res.poll = poll
        next()
    }





    function assignCurrentDate() {
        const now = new Date();
    
        let currentDay =  new Date(now.getFullYear(), now.getMonth(), now.getDate()).toUTCString();
    
        let split = currentDay.split(" ");
        split.pop();
        split.pop();
    
        let joinedDate = split.join(" ")
        console.log(joinedDate)
    
        return joinedDate
    }

   module.exports = router