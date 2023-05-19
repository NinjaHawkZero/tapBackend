const express = require('express')
const router = express.Router()
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {ExpressError} = require("../expressError")
const {tapInModel} = require("../TapInModel")
const {schoolModel} = require("../SchoolModels")
const {studentModel} = require("../StudentModel")
const { staffModel } = require('../StaffModel')
const { classStudentModel } = require('../ClassStudent');
const { classModel } = require('../ClassModel');
const {requestChatModel} = require('../chatModel')


    // TapIn Model

    // student: {type:mongoose.Schema.Types.ObjectId,
    //     ref:'Student'},
    // Date Format "yyyyMMdd"
    // date: String,
    // reviewedBy: String,
    // flagged: Boolean,
    // tapInCompleted: Boolean,
    // typeTapIn: Number || Boolean,
    // eating: Number || Boolean,
    // sleeping: Number || Boolean,
    // wellBeing: Number || Boolean


///Completion = how many took a tapIn
//Results/WellBeing Factor = Specfic answers to a TapIn that were "yes" or "true"









/////***************CRUD ROUTES FOR TAPINS********************////////////////////////


    //CREATES A TAPIN, BLOCKS CREATION IF 2 TAPINS EXIST ALREADY FOR THE DAY
    router.post('/create', async (req, res) => {


        try{


            

            let tapIn = req.body
           

            console.log(tapIn)
            let student = tapIn.student

           let foundTap = await tapInModel.find({student: student, date: getDateString()})

            console.log(foundTap.length)

           if(foundTap.length < 2) {



            let createdTapIn = await tapInModel.create({student: student, wellBeing: tapIn.wellBeing, eating: tapIn.eating, sleeping: tapIn.sleeping,  date: getDateString()})
            let savedTapIn = await createdTapIn.save()
            console.log(savedTapIn)
            res.status(201).json(savedTapIn)

           } else {

            res.status(404).json({message:"You have reach the maximum tapIns for today"})
           }

        
        }

        catch(err) {
            res.status(400).json({message: err.message})
            
        }
    
    
    });
    
    


    //GET ALL TAPINS FOR A SINGLE STUDENT
    router.get('/getAllTapInsStudent/:studentID', async (req, res) => {

try
{

    let studentID = req.params.studentID;

    let tapIns = await tapInModel.find({student:studentID})

    res.status(200).json({tapIns: tapIns})
}


catch(err)
{res.status(500).json({message: err.message})}

    })



//UPDATING ONE
    router.patch('/:id', getTapIn, async (req, res) => {

 
    
        try{
            
            
            const updatedTapIn = await res.tapIn.save()
            res.json(updatedTapIn)
        }

        catch(err) {
            res.statusCode(400).json({message: err.message})
        }
    
    });
    





//DELETE ONE
//Expects Obj ID of tapIn
    router.delete('/:_id', getTapIn,  async  (req, res) => {

        try{
            

            await res.tapIn.remove()
            res.json({message: "Deleted tapIn"})
        }

        catch(err) {
            return res.status(500).json({message: err.message})
        }
    
    
    });





///////////******************SINGLE STUDENT TAPIN ROUTES************************************ */


//WELLBEING PERCENTAGE OF LAST FIVE DAYS FOR A SINGLE STUDENT
router.get('/studentWellBeing/:_id', async (req, res) => {
    try {
        //Retrieve student
        let studentID = req.params._id;
        let datesArr = getLastFiveWeekdays();

        let countPromises = datesArr.map(async function(date) {
            let dailyTapIns = await tapInModel.find({student: studentID, date: date});
            let totalQuestions = dailyTapIns.length * 3;

            let tapInTrueCounter = 0;
            for(let obj of dailyTapIns) {
                if(obj.eating == true) {tapInTrueCounter++}
                if(obj.sleeping == true) {tapInTrueCounter++}
                if(obj.wellBeing == true) {tapInTrueCounter++}
            }

            return {totalQuestions, tapInTrueCounter};
        });

        let counts = await Promise.all(countPromises);
        let totalQuestions = counts.reduce((sum, count) => sum + count.totalQuestions, 0);
        let tapInTrueCounter = counts.reduce((sum, count) => sum + count.tapInTrueCounter, 0);

        let percentage = 100 * (tapInTrueCounter / totalQuestions);

        res.status(200).json(percentage);
    } catch(err) {
        return res.status(500).json({message: err.message});
    }
});











//COMPLETION PERCENTAGE OF LAST FIVE DAYS FOR A SINGLE STUDENT
router.get('/studentCompletion/:_id', async (req, res) => {
    try {
        //Retrieve student
        let studentID = req.params._id;
        let datesArr = getLastFiveWeekdays();
        let tapInCounter = 0;

        let datePromises = datesArr.map(date => tapInModel.find({student: studentID, date: date}));

        let dailyTapIns = await Promise.all(datePromises);
        dailyTapIns.forEach(dailyTap => {
            tapInCounter += dailyTap.length;
        });

        let percentage = 100 * (tapInCounter / 10);

        res.status(201).json(percentage);
    } catch(err) {
        return res.status(500).json({message: err.message});
    }
});



        








//GETTING ALL TAPINS OF ONE STUDENT FOR THE LAST 5 DAYS (DOES NOT INCLUDE TODAYS DATE)
router.get('/week/:_id', async (req, res) => {
    try {
        //Find Student
        let studentRefID = req.params._id;
        //Find tapIns for whole week
        let datesArr = getLastFiveWeekdays();
        //Array of arrays of tapIns
        let tapInArr = [];

        let datePromises = datesArr.map(date => tapInModel.find({student: studentRefID, date: date}));

        let dailyTapIns = await Promise.all(datePromises);
        dailyTapIns.forEach(tapIn => {
            tapInArr.push(tapIn);
        });
        
        //Return array of tapIns
        res.status(201).json(tapInArr);
    } catch(err) {
        return res.status(400).json({message: err.message});
    }
});

      



    
   
//GETTING ALL TAPINS A STUDENT HAS COMPLETED FOR THE DAY
    router.get('/dailyStudentTapIns/:_id', async (req, res) => {

        try{

           let studentRefID = req.params._id
           let tapIns = await tapInModel.find({student: studentRefID, date: getDateString()})

            res.status(201).json(tapIns)
        }
    

        catch(err) {
            res.status(400).json({message: err.message})
        }
    });
    





    














//****************STUDENT REVIEW TRIGGER FUNCTIONS *////////////////////////////////////




//Thumbs down on any question 3 days or more out of a week
//Out of the past 5 days,  out of all questions answered, if 3 questions are answered false.
//Sets flags based on counters.  Flags mean 3 or more days were missed for a category.  On FrontEnd deliver warning based on flag.  

router.get('/studentTriggers1/:staffID', async (req, res) => {
    try {
        let classStudentObjs = await classStudentModel.find({staffID: req.params.staffID})

        let foundStudentsPromises = classStudentObjs.map(async function(obj) {
            let retrievedStudent = await studentModel.find({_id: obj.studentID});
            
            return retrievedStudent[0];
        });

        let foundStudents = await Promise.all(foundStudentsPromises);

        let studentReviewPromises = foundStudents.map(async function(student) {
            let datesArray = getLastFiveWeekdays()
            let didNotEatCounter = 0;
            let didNotSleepCounter = 0;
            let didNotFeelWellCounter = 0;

            let tapInPromises = datesArray.map(async function(date) {
                let tapIns = await tapInModel.find({student:student._id, date: date});

                tapIns.forEach(function(tapIn) {

                    if(tapIn.eating == false ) {
                        didNotEatCounter +=1;
                    }

                    if(tapIn.sleeping == false) {
                        didNotSleepCounter += 1;

                    }

                    if(tapIn.wellBeing == false) {

                        didNotFeelWellCounter += 1;

                    }

                });
            });

            await Promise.all(tapInPromises);



            if(didNotEatCounter >= 3) {


                student.didEatFlag = "Did not eat 3/5 days.";               

            }


            if(didNotSleepCounter >= 3) {


                student.didSleepFlag = "Did not sleep 3/5 days.";               

            }



            if(didNotFeelWellCounter >= 3) {


                student.wellBeingFlag = "Did not feel well 3/5 days.";               

            }

            return student


        });

        let studentReview = await Promise.all(studentReviewPromises);

        // Filter out any undefined values (students who didn't meet the condition)
        studentReview = studentReview.filter(student => student !== undefined);

        res.status(201).json({reviewStudents: studentReview});
    } catch(err) {
        res.status(400).json({message:err.message});
    }
});









//Student fails to complete Tap In survey 3/5 days in a week = trigger review.
//Out of past five week days in no tapIn survey was found 3/5 dates.

router.get('/studentTriggers2/:staffID', async (req, res) => {
    try {
        let classStudentObjs = await classStudentModel.find({staffID: req.params.staffID})

        let foundStudentsPromises = classStudentObjs.map(async function(obj) {
            let retrievedStudent = await studentModel.find({_id: obj.studentID});
            return retrievedStudent[0];
        });

        let foundStudents = await Promise.all(foundStudentsPromises);

        let studentReviewPromises = foundStudents.map(async function(student) {
            let datesArray = getLastFiveWeekdays();
            let tapInCounter = 0;

            let tapInPromises = datesArray.map(async function(date) {
                let tapIns = await tapInModel.find({student:student._id, date: date});

                tapIns.forEach(function(tapIn) {
                    if(tapIn) {
                        tapInCounter +=1;
                    }
                });
            });

            await Promise.all(tapInPromises);

            if(tapInCounter <= 4) {
                student.flagged = true
                return student;
            }
        });

        let studentReview = await Promise.all(studentReviewPromises);

        // Filter out any undefined values (students who didn't meet the condition)
        studentReview = studentReview.filter(student => student !== undefined);

        res.status(201).json({reviewStudents: studentReview});
    } catch(err) {
        res.status(400).json({message:err.message});
    }
});







//Thumbs down on any question 3 days in a row
//Out of total questions answered last 3 days, if there was a question answered false at least once everyday.
//Sets flags based on counters.  Flags mean 3 or more days were missed for a category.  On FrontEnd deliver warning based on flag.

router.get('/studentTriggers3/:staffID', async (req, res) => {
    try {
        let classStudentObjs = await classStudentModel.find({staffID: req.params.staffID})

        let foundStudentsPromises = classStudentObjs.map(async function(obj) {
            let retrievedStudent = await studentModel.find({_id: obj.studentID});
            return retrievedStudent[0];
        });

        let foundStudents = await Promise.all(foundStudentsPromises);

        let studentReviewPromises = foundStudents.map(async function(student) {
            let datesArray = getLastThreeWeekdaysString();
            let didNotEatCounter = 0;
            let didNotSleepCounter = 0;
            let didNotFeelWellCounter = 0;

            let tapInPromises = datesArray.map(async function(date) {
                let tapIns = await tapInModel.find({student:student._id, date: date});

                tapIns.forEach(function(tapIn) {


                    if(tapIn.eating == false ) {
                        didNotEatCounter +=1;
                    }

                    if(tapIn.sleeping == false) {
                        didNotSleepCounter += 1;

                    }

                    if(tapIn.wellBeing == false) {

                        didNotFeelWellCounter += 1;

                    }



                });
            });

            await Promise.all(tapInPromises);




           
            if(didNotEatCounter >= 3) {


                student.didEatFlag = "Did not eat 3 days in a row.";               

            }


            if(didNotSleepCounter >= 3) {


                student.didSleepFlag = "Did not sleep 3 days in a row.";               

            }



            if(didNotFeelWellCounter >= 3) {


                student.wellBeingFlag = "Did not feel well 3 days in a row.";               

            }

            return student




        });


        let studentReview = await Promise.all(studentReviewPromises);

        // Filter out any undefined values (students who didn't meet the condition)
        studentReview = studentReview.filter(student => student !== undefined);

        res.status(201).json({reviewStudents: studentReview});
    } catch(err) {
        res.status(400).json({message:err.message});
    }
});




//Thumbs down on two questions in a given day.
//For two tapIn objs in a day
router.get('/studentTriggers4/:staffID', async (req, res) => {
    try {
        //Find all students for teacher
        let classStudentObjs = await classStudentModel.find({staffID: req.params.staffID})

        let foundStudentsPromises = classStudentObjs.map(async function(obj) {
            let retrievedStudent = await studentModel.find({_id: obj.studentID});
            return retrievedStudent[0];
        });

        let foundStudents = await Promise.all(foundStudentsPromises);

        let studentReviewPromises = foundStudents.map(async function(student) {
            
            let didNotEatCounter = 0;
            let didNotSleepCounter = 0;
            let didNotFeelWellCounter = 0;
            let todaysTapIns = await tapInModel.find({student: student._id, date: getDateString()});

            todaysTapIns.forEach(function(tapIn) {



                if(tapIn.eating == false ) {
                    didNotEatCounter +=1;
                }

                if(tapIn.sleeping == false) {
                    didNotSleepCounter += 1;

                }

                if(tapIn.wellBeing == false) {

                    didNotFeelWellCounter += 1;

                }



            });


            if(didNotEatCounter >= 3) {


                student.didEatFlag = "Did not eat today.";               

            }


            if(didNotSleepCounter >= 3) {


                student.didSleepFlag = "Did not sleep today.";               

            }



            if(didNotFeelWellCounter >= 3) {


                student.wellBeingFlag = "Did not feel well today";               

            }

            return student


            
        });

        let studentReview = await Promise.all(studentReviewPromises);

        // Filter out any undefined values (students who didn't meet the condition)
        studentReview = studentReview.filter(student => student !== undefined);

        res.status(201).json({reviewStudents: studentReview});
    } catch(err) {
        res.status(400).json({message: err.message});
    }
});








      













//***************************************************************************************** */
//SCHOOL ROUTES



//GET SCHOOL DAILY COMPLETION OF TAPINS

router.get('/schoolDailyCompletion/:schoolID', async (req, res ) => {
    try{
        let schoolID = req.params.schoolID;

        let foundStudents = await studentModel.find({schoolID: schoolID});

        let dailyTapInsPromises = foundStudents.map(async function(student) {
            return await tapInModel.find({student: student._id, date: getDateString()});
        });

        let dailyTapInsResults = await Promise.all(dailyTapInsPromises);

        // Flatten the array of arrays and get the total count
        let dailyTapIns = dailyTapInsResults.flat().length;

        let percentage = 100 * (dailyTapIns / (foundStudents.length));

        res.status(200).json({percentage: percentage});
    }
    catch(err){
        return res.status(500).json({message: err.message});
    }
});






//GET LAST 5 DAYS OF TAPIN COMPLETION PERCENTAGES FOR A SCHOOL
//RESTURNS ARRAY OF OBJS WITH DATE AND PERCENTAGES

router.get('/schoolFiveDayCompletion/:schoolID', async (req, res) => {
    try{
        let schoolID = req.params.schoolID;
        let datesArr = getLastFiveWeekdays();
        let foundStudents = await studentModel.find({schoolID: schoolID});
        let weeklyObjArr = []; 

        for (let date of datesArr) {
            let dailyTapInsPromises = foundStudents.map(async function(student) {
                return await tapInModel.find({student: student._id, date: date});
            });

            let dailyTapInsResults = await Promise.all(dailyTapInsPromises);
            let dailyTapIns = dailyTapInsResults.flat().length;
            let percentage = 100 * (dailyTapIns / (foundStudents.length));

            let obj = {date: date, percentage: percentage};

            weeklyObjArr.push(obj);
        }

        res.status(200).json(weeklyObjArr);
    } catch(err) {
        return res.status(500).json({message: err.message});
    }
});






//GET DAILY TAPIN RESULTS PERCENTAGE FOR A SCHOOL

router.get('/schoolDailyResult/:schoolID', async (req, res) => {
    try {
        let schoolID = req.params.schoolID;
        let foundStudents = await studentModel.find({schoolID: schoolID});

        let dailyTapInsPromises = foundStudents.map(async function(student) {
            return await tapInModel.find({student: student._id, date: getDateString()});
        });

        let dailyTapInsResults = await Promise.all(dailyTapInsPromises);
        let dailyTapIns = dailyTapInsResults.flat();

        let totalTapQuestions = dailyTapIns.length * 3;

        let tapInTrueCounter = 0;

        for(let tapIn of dailyTapIns) {
            if(tapIn.eating == true) {tapInTrueCounter++;}
            if(tapIn.sleeping == true) {tapInTrueCounter++;}
            if(tapIn.wellBeing == true) {tapInTrueCounter++;}
        }

        let percentage = 100 * (tapInTrueCounter / totalTapQuestions);

        res.status(200).json({percentage: percentage});
    } catch(err) {
        return res.status(500).json({message: err.message});
    }
});





//GET LAST 5 DAYS RESULTS PERCENTAGE OF TAPINS FOR A SCHOOL, FOR BAR CHART
router.get('/schoolFiveDayResult/:schoolID', async (req, res) => {
    try {
        let schoolID = req.params.schoolID;
        let foundStudents = await studentModel.find({schoolID: schoolID});
        let datesArr = getLastFiveWeekdays();
        let weekObj = [];

        for (let date of datesArr) {
            let dailyTapInsPromises = foundStudents.map(async function(student) {
                return await tapInModel.find({student: student._id, date: date});
            });

            let dailyTapInsResults = await Promise.all(dailyTapInsPromises);
            let dailyTapIns = dailyTapInsResults.flat();

            let totalTapQuestions = dailyTapIns.length * 3;

            let tapInTrueCounter = 0;

            for(let tapIn of dailyTapIns) {
                if(tapIn.eating == true) {tapInTrueCounter++;}
                if(tapIn.sleeping == true) {tapInTrueCounter++;}
                if(tapIn.wellBeing == true) {tapInTrueCounter++;}
            }

            let percentage = 100 * (tapInTrueCounter / totalTapQuestions);
            let obj = {date: date, percentage: percentage};

            weekObj.push(obj);
        }

        res.status(200).json(weekObj);
    } catch(err) {
        return res.status(500).json({message: err.message});
    }
});














//////////////////********CLASSROUTES************************//////////////////*/






//GET DAILY COMPLETION PERCENTAGE OF TAPINS FOR A CLASS OF STUDENTS
router.get('/classDailyCompletion/:classID', async (req, res, next) => {
    try{
        let classID  = req.params.classID;
        let classOfStudents = await classStudentModel.find({classID: classID});

        let dailyTapInsPromises = classOfStudents.map(student => {
            return tapInModel.find({student: student.studentID , date: getDateString()});
        });

        let dailyTapInsResults = await Promise.all(dailyTapInsPromises);
        let dailyTapIns = dailyTapInsResults.flat();

        // If you need to count only completed tap-ins, you can filter the dailyTapIns array
        // dailyTapIns = dailyTapIns.filter(tapIn => tapIn.isCompleted);

        let percentage = 100 * (dailyTapIns.length / classOfStudents.length);

        res.status(200).json(percentage);
    }
    catch(err) {
        return res.status(500).json({message: err.message});
    }
});














//GET ARRAY OF DAILY COMPLETION DATA FOR ALL CLASSES OF A TEACHER

router.get('/allClassesDailyCompletion/:staffID', async (req, res) => {
    try {
        let staffID = req.params.staffID;
        let foundStaffMember = await staffModel.find({_id: staffID});
        let classPercentageArr = [];
        let hours = ["firstHour", "secondHour", "thirdHour", "fourthHour", "fifthHour", "sixthHour", "seventhHour", "eighthHour"];

        for(let hour of hours){
            let classHour = await classModel.find({staffID: foundStaffMember[0]._id, hour: hour});
            let students = await classStudentModel.find({classID: classHour[0]._id});
            let dailyTapIns = await Promise.all(students.map(async function (student) {
                return await tapInModel.find({student: student.studentID, date: getDateString()})
            }));
            let percentage = 100 * (dailyTapIns.filter(tapIn => tapIn.length).length / students.length);
            let obj = {percentage: percentage, class: hour};
            classPercentageArr.push(obj);
        }
        return res.status(200).json(classPercentageArr);
    } catch(err) {
        return res.status(500).json({message: err.message});
    }
});










//GET LAST 5 DAYS COMPLETION PERCENTAGE OF TAPINS FOR CLASS
router.get('/classFiveDayCompletion/:classID', async (req, res) => {
    try {
        let classID = req.params.classID;
        let students = await classStudentModel.find({classID: classID});
        let datesArr = getLastFiveWeekdays();
        let weekObj = [];

        for (let date of datesArr) {
            let dailyTapInsPromises = students.map(student => tapInModel.find({student: student.studentID, date: date}));
            let dailyTapIns = await Promise.all(dailyTapInsPromises);
            let percentage = 100 * (dailyTapIns.filter(tapIn => tapIn.length).length / students.length);
            let obj = {date: date, percentage: percentage};
            weekObj.push(obj);
        }

        res.status(200).json(weekObj);
    } catch(err) {
        return res.status(500).json({message: err.message});
    }
});






//GET DAILY RESULTS PERCENTAGE OF TAPINS FOR A CLASS OF STUDENTS

router.get('/classDailyResult/:classID', async (req, res) => {
    try {
        let classID = req.params.classID;
        let students = await classStudentModel.find({classID: classID});
        let dailyTapInsPromises = students.map(student => tapInModel.find({student: student.studentID, date: getDateString()}));
        let dailyTapIns = await Promise.all(dailyTapInsPromises);

        let totalTapQuestions = dailyTapIns.length * 3;
        let tapInTrueCounter = 0;

        for(let tapInArray of dailyTapIns) {
            for(let obj of tapInArray) {
                if(obj.eating == true) {tapInTrueCounter++}
                if(obj.sleeping == true) {tapInTrueCounter++}
                if(obj.wellBeing == true) {tapInTrueCounter++}
            }
        }

        let percentage = 100 * (tapInTrueCounter / totalTapQuestions);
        res.status(200).json(percentage);
    } catch(err) {
        return res.status(500).json({message: err.message});
    }
});


        









//GET ARRAY OF DAILY RESULTS FOR ALL CLASSES FOR A TEACHER

router.get('/allClassesDailyResult/:staffID', async (req, res) => {
    try {
        let staffID = req.params.staffID;
        let foundStaffMember = await staffModel.find({ _id: staffID });
        let classPercentageArr = [];

        let hours = ["firstHour", "secondHour", "thirdHour", "fourthHour", "fifthHour", "sixthHour", "seventhHour", "eighthHour"];
        for(let hour of hours) {
            let foundClass = await classModel.find({ staffID: foundStaffMember[0]._id, hour: hour });
            let students = await classStudentModel.find({ classID: foundClass[0]._id });
            let dailyTapIns = await Promise.all(students.map(student => 
                tapInModel.find({ student: student.studentID, date: getDateString() })
            ));

            let totalTapQuestions = dailyTapIns.length * 3;
            let tapInTrueCounter = 0;

            for(let obj of dailyTapIns) {
                if(obj.eating == true) { tapInTrueCounter++ }
                if(obj.sleeping == true) { tapInTrueCounter++ }
                if(obj.wellBeing == true) { tapInTrueCounter++ }
            }

            let percentage = 100 * (tapInTrueCounter / totalTapQuestions);
            let classResult = { percentage: percentage, class: hour };
            classPercentageArr.push(classResult);
        }

        res.status(200).json(classPercentageArr);
    } catch(err) {
        return res.status(500).json({ message: err.message });
    }
});











//GET LAST 5 DAYS OF RESULT PERCENTAGES OF TAPINS FOR A CLASS OF STUDENTS
router.get('/classFiveDayResult/:classID', async (req, res) => {
    try {
        let classID = req.params.classID;
        let students = await classStudentModel.find({ classID: classID });
        let datesArr = getLastFiveWeekdays();
        let weekObj = [];

        for(let date of datesArr) {
            let dailyTapIns = await Promise.all(students.map(student => 
                tapInModel.find({ student: student.studentID, date: date })
            ));

            let totalTapQuestions = dailyTapIns.length * 3;
            let tapInTrueCounter = 0;

            for(let obj of dailyTapIns) {
                if(obj.eating == true) { tapInTrueCounter++ }
                if(obj.sleeping == true) { tapInTrueCounter++ }
                if(obj.wellBeing == true) { tapInTrueCounter++ }
            }

            let percentage = 100 * (tapInTrueCounter / totalTapQuestions);
            let obj = { date: date, percentage: percentage };
            weekObj.push(obj);
        }

        res.status(200).json(weekObj);
    } catch(err) {
        return res.status(500).json({ message: err.message });
    }
});


          








/////////////**************HRT ROUTES*****************//////////////////////////*/











//GET DAILY COMPLETION PERCENTAGE OF TAPINS FOR HRT

router.get('/hrtDailyCompletion/:staffID', async (req, res) => {
    try {
        let hrt = req.params.staffID;
        let foundStudents = await studentModel.find({ hrt: hrt });

        let dailyTapIns = await Promise.all(foundStudents.map(async (student) => 
            tapInModel.find({ student: student._id, date: getDateString() })
        ));

        // Here we take the length of dailyTapIns.
        let percentage = 100 * (dailyTapIns.length / foundStudents.length);

        res.status(200).json(percentage);
    } catch(err) {
        return res.status(500).json({ message: err.message });
    }
});





//GET LAST 5 DAYS COMPLETION PERCENTAGE FOR A HRT

router.get('/hrtFiveDayCompletion/:staffID', async (req, res) => {
    try {
        let hrt = req.params.staffID;
        let foundStudents = await studentModel.find({ hrt: hrt });

        let datesArr = getLastFiveWeekdays();
        let weekObj = [];

        for (let date of datesArr) {
            let dailyTapIns = await Promise.all(foundStudents.map(student => 
                tapInModel.find({ student: student._id, date: date })
            ));

            let percentage = 100 * (dailyTapIns.length / foundStudents.length);

            let obj = { date: date, percentage: percentage };
            weekObj.push(obj);
        }

        res.status(200).json(weekObj);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});












//GET DAILY RESULTS PERCENTAGE OF TAPINS FOR HRT

router.get('/hrtDailyResult/:staffID', async(req, res) => {
    try{
        let staffID = req.params.staffID;

        let students = await studentModel.find({hrt: staffID});

        let dailyTapIns = await Promise.all(students.map(student => 
            tapInModel.find({student: student._id, date: getDateString()})
        ));

        let totalTapQuestions = dailyTapIns.length * 3;

        let tapInTrueCounter = 0;

        for(let obj of dailyTapIns) {
            if(obj.eating == true) {tapInTrueCounter++}
            if(obj.sleeping == true) {tapInTrueCounter++}
            if(obj.wellBeing == true) {tapInTrueCounter++}
        }

        let percentage = 100 * (tapInTrueCounter / totalTapQuestions)

        res.status(200).json(percentage);

    } catch(err) {
        return res.status(500).json({message: err.message});
    }
});









//GET LAST 5 DAYS RESULTS PERCENTAGE OF TAPINS FOR HRT

router.get('/hrtFiveDayResult/:staffID', async (req, res) => {
    try{
        let staffID = req.params.staffID;

        let students = await studentModel.find({hrt: staffID}); 

        let datesArr = getLastFiveWeekdays();
        let weekObj = [];

        for (let date of datesArr) {
            let dailyTapIns = await Promise.all(students.map(student => 
                tapInModel.find({student: student._id, date: date})
            ));

            let totalTapQuestions = dailyTapIns.length * 3;
            let tapInTrueCounter = 0;

            for(let obj of dailyTapIns) {
                if(obj.eating == true) {tapInTrueCounter++}
                if(obj.sleeping == true) {tapInTrueCounter++}
                if(obj.wellBeing == true) {tapInTrueCounter++}
            }

            let percentage = 100 * (tapInTrueCounter / totalTapQuestions);
            let obj = {date: date, percentage: percentage};

            weekObj.push(obj);
        }

        res.status(200).json(weekObj);
    } catch(err) {
        return res.status(500).json({message: err.message});
    }
});











////////////////***************COUNSELOR ROUTES************////////////////////////////// */




//GET DAILY COMPLETION PERCENTAGE OF TAPINS FOR COUNSELOR

router.get('/counselorDailyCompletion/:staffID', async (req, res) => {
    try{
        let counselor = req.params.staffID;
        let foundStudents = await studentModel.find({counselor: counselor});
        let dailyTapIns = await Promise.all(foundStudents.map(student => 
            tapInModel.find({student: student._id, date: getDateString()})
        ));

        let percentage = 100 * (dailyTapIns.length / foundStudents.length);

        res.status(200).json(percentage);
    } catch(err) {
        return res.status(500).json({message: err.message});
    }
});




//GET LAST 5 DAYS COMPLETION PERCENTAGE OF TAPINS FOR COUNSELOR

router.get('/counselorFiveDayCompletion/:staffID', async (req, res) => {
    try {
        let counselorID = req.params.staffID;
        let counselorArr = await staffModel.find({_id: counselorID});
        let students = await studentModel.find({counselor: counselorArr[0]._id});
        let datesArr = getLastFiveWeekdays();
        let weekObj = [];

        await Promise.all(datesArr.map(async date => {
            let dailyTapIns = await Promise.all(students.map(student => 
                tapInModel.find({student: student._id, date: date})
            ));

            let percentage = 100 * (dailyTapIns.length / students.length);
            let obj = {date: date, percentage: percentage};
            weekObj.push(obj);
        }));

        res.status(200).json(weekObj);
    } catch(err) {
        return res.status(500).json({message: err.message});
    }
});









//GET DAILY RESULTS PERCENTAGE FOR A COUNSELOR

router.get('/counselorDailyResult/:staffID', async (req, res) => {
    try {
        let counselorID = req.params.staffID;
        let counselor = await staffModel.find({_id: counselorID});
        let students = await studentModel.find({counselor: counselor[0]._id});

        let dailyTapIns = await Promise.all(students.map(async student => 
            tapInModel.find({student: student._id, date: getDateString()})
        ));

        let totalTapInQuestions = dailyTapIns.length * 3;
        let tapInTrueCounter = 0;

        for(let obj of dailyTapIns) {
            if(obj.eating == true) {tapInTrueCounter++}
            if(obj.sleeping == true) {tapInTrueCounter++}
            if(obj.wellBeing == true) {tapInTrueCounter++}
        }

        let percentage = 100 * (tapInTrueCounter / totalTapInQuestions);

        res.status(200).json(percentage);
    } catch(err) {
        return res.status(500).json({message: err.message});
    }
});

     




//GET LAST 5 DAYS RESULTS PERCENTAGE OF TAPINS FOR COUNSELOR

router.get('/counselorFiveDayResult/:staffID', async(req, res) => {
    try {
        let counselorID = req.params.staffID;
        let counselor = await staffModel.find({_id: counselorID});
        let students = await studentModel.find({counselor: counselor[0]._id});
        let datesArr = getLastFiveWeekdays();
        let weekObj = [];

        for (let date of datesArr) {
            let dailyTapIns = await Promise.all(students.map(async student =>
                tapInModel.find({student: student._id, date: date})
            ));
            
            // Flatten dailyTapIns array
            dailyTapIns = dailyTapIns.flat();

            let totalTapQuestions = dailyTapIns.length * 3;
            let tapInTrueCounter = 0;

            for(let obj of dailyTapIns) {
                if(obj.eating == true) {tapInTrueCounter++}
                if(obj.sleeping == true) {tapInTrueCounter++}
                if(obj.wellBeing == true) {tapInTrueCounter++}
            }

            let percentage = 100 * (tapInTrueCounter / totalTapQuestions);
            let obj = {date: date, percentage: percentage};

            weekObj.push(obj);
        }

        res.status(200).json(weekObj);
    } catch(err) {
        return res.status(500).json({message: err.message});
    }
});


          




////*******************REQUEST A CHAT ROUTES **********************************/

//One route from the student to schedule with staff.  Post request.


router.post('/requestChat/:studentID', async (req, res) => {

    try
    {
        let studentID = req.body.studentID;
        let staffID = req.body.staffID;
    
        let meeting = await requestChatModel.create({studentID: studentID, staffID: staffID, didMeet: false, meetDate: " "});

        await meeting.save()


        res.status(201).json({message: "You made the meeting!"})
    }

catch(err)
{res.status(500).json({message: err.message})}
});




//One route  to mark that they met and assign a date to it.  Post request.

router.post('/madeChat/:staffID', async (req, res) => {

try {

    let staffID = req.body.staffID
    let studentID = req.body.studentID

    let foundMeet = await requestChatModel.find({staffID: staffID, studentID: studentID, didMeet: false, });

    if(foundMeet.length > 0) {

        foundMeet[0].didMeet = true;
        foundMeet[0].meetDate = getDateString();

      let meet = await  foundMeet[0].save()

       res.status(201).json({meeting: meet})
    }



}

catch(err)
{res.status(500).json({message: err.message})}


} );


//One route to retrieve all students requesting a chat for a staff member.  Get request.

router.get('/studentRequests/:staffID', async (req, res) => {

    try
    {
        let staffID = req.params.staffID;
        
        let foundStudents = await requestChatModel.find({staffID: staffID})

       let review = await Promise.all(foundStudents.map(student => 
        studentModel.find({_id: student._id})));

        let flattened = review.flat()

        res.status(200).json({requestedChat: flattened})



    }

    catch(err)
    {res.status(500).json({message: err.message})}
})







router.get('/counselorDailyCompletion/:staffID', async (req, res) => {
    try{
        let counselor = req.params.staffID;
        let foundStudents = await studentModel.find({counselor: counselor});
        let dailyTapIns = await Promise.all(foundStudents.map(student => 
            tapInModel.find({student: student._id, date: getDateString()})
        ));

        let percentage = 100 * (dailyTapIns.length / foundStudents.length);

        res.status(200).json(percentage);
    } catch(err) {
        return res.status(500).json({message: err.message});
    }
});




//********************************************************************************************************************* */
//Middleware that pulls id from body of request and checks if tap in exists
async function getTapIn(req, res, next) {
    let tapIn;

    try{
        tapIn = await tapInModel.findById(req.params._id);
        if(tapIn == null) {
            return res.status(404).json({message: "Cannot get tapIn"})
        }
    }
    catch(err) {
        return res.status(500).json({message: err.message})
    }

    res.tapIn = tapIn
    next()
};










//**********DATE FUNCTIONS**************





function getDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    // Add leading zeros if needed
    const paddedMonth = month.toString().padStart(2, '0');
    const paddedDay = day.toString().padStart(2, '0');
  
    return `${year}${paddedMonth}${paddedDay}`;
  }
  
  

//RETURNS 20230328



//Get Last five weekday dates, returns array of string dates in "yyyymmdd"
//[ '20230327', '20230324', '20230323', '20230322', '20230321' ]
function getLastFiveWeekdays() {
    const weekdays = [];
    let currentDate = new Date();
    while (weekdays.length < 5) {
      currentDate.setDate(currentDate.getDate() - 1);
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const year = currentDate.getFullYear().toString();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const day = currentDate.getDate().toString().padStart(2, '0');
        weekdays.push(year + month + day);
      }
    }
    return weekdays;
  }
  
  

  
  
  



   


     




function getLastThreeWeekdaysString() {
    const weekdays = []; // Array to store the last 3 weekdays
    let count = 0; // Counter for the number of weekdays generated
    let daysToSubtract = 1; // Start by subtracting 1 day
  
    // Loop until we have 3 weekdays
    while (count < 3) {
      // Get the date to subtract
      const dateToSubtract = new Date();
      dateToSubtract.setDate(dateToSubtract.getDate() - daysToSubtract);
  
      // Check if the date is a weekend
      const dayOfWeek = dateToSubtract.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // If it's a weekday, format the date as a string in "yyyymmdd" format and add it to the array
        const year = dateToSubtract.getFullYear();
        const month = (dateToSubtract.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed in JavaScript, so add 1 and pad with leading zeros
        const day = dateToSubtract.getDate().toString().padStart(2, "0"); // Pad with leading zeros if necessary
        weekdays.push(`${year}${month}${day}`);
        count++;
      }
      daysToSubtract++;
    }
  
    return weekdays;
}
//Returns [ '20230512', '20230511', '20230510' ]

  
console.log(getLastThreeWeekdaysString())




    module.exports = router


