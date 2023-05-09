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



    //TapIn Model

    // student: {type:mongoose.Schema.Types.ObjectId,
    //     ref:'Student'},
    //Date Format "yyyyMMdd"
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




//WellBeing percentage for last five days for a single student
router.get('/studentWellBeing/:_id', async (req, res) => {

    try{

        //Retrieve student
        let studentID = req.params._id;

        let datesArr = getLastFiveWeekdays();


        let totalQuestions = 0;

        let tapInTrueCounter = 0;


        datesArr.forEach(async function(date) {
            let dailyTapIns = await tapInModel.find({student: studentID, date: date});

          totalQuestions +=  dailyTapIns.length * 3;

          for(let obj of dailyTapIns) {
            if(obj.eating == true) {tapInTrueCounter++}
            if(obj.sleeping == true) {tapInTrueCounter++}
            if(obj.wellBeing == true) {tapInTrueCounter++}
        }
        } );


        let percentage = 100 * (tapInTrueCounter / totalQuestions)

        res.status(201).json(percentage)



    }
    catch(err)
    {return res.status(500).json({message: err.message})}

});








//Completion percentage for last five days for a single student
router.get('/studentCompletion/:_id', async (req, res) => {

    try{

        //Retrieve student
        let studentID = req.params._id;

        let datesArr = getLastFiveWeekdays();


        

        let tapInCounter = 0;


        datesArr.forEach(async function(date) {
            let dailyTapIns = await tapInModel.find({student: studentID, date: date});

            tapInCounter += dailyTapIns.length
         

        
        } );


        let percentage = 100 * (tapInCounter / 10)

        res.status(201).json(percentage)



    }
    catch(err)
    {return res.status(500).json({message: err.message})}

});






//For one student
//Getting All Student Tapins for the last 5 Days  (does not include todays date)
router.get('/week/:_id', async (req, res) => {

    try{
        //Find Student
        let studentRefID = req.params._id
        //Find tapIns for whole week

        let datesArr = getLastFiveWeekdays();
        //Array of arrays of tapIns
        let tapInArr = [];

        for(let dateStr of datesArr) {
            
            let tapIn = await tapInModel.find({student: studentRefID, date: dateStr});

            tapInArr.push(tapIn)

        }

        
        //Return array of tapIns
        res.status(201).json(tapInArr)
    }
    
catch(err) {
   return res.status(400).json({message: err.message})
}

    });



    
    //For one student
    //Getting Student TapIn/s for the Day
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
    





    
    //Creating A TapIn, blocks creation if 2 tapins exist already for the day
    router.post('/create', async (req, res) => {


        try{


            

            let tapIn = req.body
            tapIn.date = getDateString()
            let student = tapIn.studentID

           let foundTap = await tapInModel.find({student: student, date: getDateString()})


           if(foundTap.length < 2) {


            let createdTapIn = await tapInModel.create(tapIn)
            let savedTapIn = await createdTapIn.save()

            res.status(201).json(savedTapIn)

           } else {

            res.status(404).json({message:"You have reach the maximum tapIns for today"})
           }

        
        }

        catch(err) {
            res.status(400).json({message: err.message})
            
        }
    
    
    });
    
    


    //Updating one
    router.patch('/:id', getTapIn, async (req, res) => {

 
    
        try{
            
            
            const updatedTapIn = await res.tapIn.save()
            res.json(updatedTapIn)
        }

        catch(err) {
            res.statusCode(400).json({message: err.message})
        }
    
    });
    





    //Delete one
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



//*********************STUDENT REVIEW ROUTES */
//Function must take staff member data, retrieve all students, filter students with tapIns that have flagged turned to true, return students

router.get('/studentReview/:staffID', async (req, res)  => {
    try{
        let staffID = req.params.staffID;

        let staffMember = await staffModel.find({_id: staffID});

        if(staffMember[0].title === "counselor")

        { 
            
      let students = await studentModel.find({counselor: staffMember._id});
      let reviewArr = [];
      students.forEach( async function(student) {

        let tapIns = await tapInModel.find({flagged: true, student: student._id})

        if(tapIns.length > 0) {reviewArr.push(tapIns)}
        
      });



        return res.status(201).json(reviewArr)


    }

    else if (staffMember[0].title === "hrt")  



    {

        let students = await studentModel.find({hrt: staffMember._id});
    
        let reviewArr = [];

        students.forEach( async function(student) {
  
          let tapIns = await tapInModel.find({flagged: true, student: student._id})
  
          if(tapIns.length > 0) {reviewArr.push(tapIns)}
          
        });


        return res.status(201).json(reviewArr)


    }



    else {

      let students = await studentModel.find({school: staffMember.schoolID});

      let reviewArr = [];
      students.forEach( async function(student) {

        let tapIns = await tapInModel.find({flagged: true, student: student._id})

        if(tapIns.length > 0) {reviewArr.push(tapIns)}
        
      })


        return res.status(201).json(reviewArr)
    }
       

    }

    catch(err)
    {return res.status(500).json({message: err.message})}
})












//***************************************************************************************** */
//SCHOOL ROUTES



//Get daily tapIn Completion percentage of tapIns for a school
router.get('/schoolDailyCompletion/:schoolID', async (req, res ) => {
    try{
        //First look up by schoolCode
        let schoolID = req.params.schoolID;

        //Array of total student objs
        let foundStudents = await studentModel.find({schoolID: schoolID})
        
        



     
        
    //Array of completed tapIn objects for today
        let dailyTapIns = await Promise.all( foundStudents.forEach(async function(student) {
     //Find all tapIns that match student ids AND were completed today
          return  await tapInModel.find({student: student._id, date: getDateString()})
        }));

//Get daily tapIn completion percentage
       let percentage =  100 * (dailyTapIns / (foundStudents.length))

       res.status(201).json(percentage)
    }
    catch(err){
        return res.status(500).json({message: err.message})

    }
});




//Get Last 5 Days tapIn Completion percentages of tapIns for a school
//Returns array of objs with date and percentages 

router.get('/schoolFiveDayCompletion/:schoolID', async (req, res) => {


try{

    let schoolID = req.params.schoolID;
    let datesArr = getLastFiveWeekdays();
    let foundStudents = await studentModel.find({schoolID: schoolID});
    let weeklyObjArr = [] 



    datesArr.forEach(async function(date){

let students = await Promise.all(foundStudents.forEach(async function(obj) {

    return await studentModel.find({_id: obj._id})



}));


let dailyTapIns =  await Promise.all(students.map(async function(student) {
    return await tapInModel.find({student: student._id, date: getDateString()})
}));



let percentage = 100 * (dailyTapIns / (foundStudents.length ))

let obj = {date: date, percentage: percentage};

weeklyObjArr.push(obj)


    });


res.status(201).json(weeklyObjArr)

}


catch(err)
{return res.status(500).json({message: err.message})}






});




//Get daily tapIn results percentage for a school

router.get('/schoolDailyResult/:schoolID', async (req, res) => {

    try{
        //Pull schoolCode from body
        let schoolID = req.body.schoolID;
        //Find school 
        let foundStudents = await studentModel.find({schoolID: schoolID});
    

    
     
    
    
    
        //Array of completed tapIn objects for today
        let dailyTapIns = await Promise.all(foundStudents.map(async function(student) {
    
           return await tapInModel.find({student: student._id, date: getDateString()})
        }));


    
        //Total number of tapIn questions for tapIns completed today       
        let totalTapQuestions = dailyTapIns.length * 3
    
    
        let tapInTrueCounter = 0;
    
    
        //For the total amount of tapIn Questions, how many received yes responses
        for(let obj of dailyTapIns) {
            if(obj.eating == true) {tapInTrueCounter++}
            if(obj.sleeping == true) {tapInTrueCounter++}
            if(obj.wellBeing == true) {tapInTrueCounter++}
        }
    
        //count total yes responses
    
        let percentage =  100 * (tapInTrueCounter / totalTapQuestions)
    
        res.status(201).json(percentage)
    
    
    
    }
    
    catch(err) {
        return res.status(500).json({message: err.message})
    }
    
    
    });




//Get Last 5 days results percentage of TapIns for a school, for bar chart

router.get('/schoolFiveDayResult/:schoolID', async (req, res) => {
    try{

        //Extract school code
        let schoolID = req.params.schoolID;
        //Find School
        let foundStudents = await studentModel.find({schoolID: schoolID});
       

        let datesArr = getLastFiveWeekdays();
        
        let weekObj = [];

        let totalTapQuestions;




        // await Promise.all(datesArr.map(async function(date) {
        //     // For each date, create array of daily tapIns
        //     let dailyTapIns = await Promise.all(students.map(async function(student) {
        //       return await tapInModel.find({ student: student._id, date: date });
        //     }));
        //     // Do something with dailyTapIns for this date
        //   }));
          

        

       await Promise.all( datesArr.forEach(async function(date) {


            ///For each date create array of daily tapIns
        let dailyTapIns = await Promise.all( foundStudents.map(async function (student) {


           return  await tapInModel.find({student: student._id, date: date})


        }));


        totalTapQuestions = dailyTapIns.length * 3;
        let tapInTrueCounter = 0;

        for (let obj of dailyTapIns) {
            if(obj.eating == true) {tapInTrueCounter++}
            if(obj.sleeping == true) {tapInTrueCounter++}
            if(obj.wellBeing == true) {tapInTrueCounter++}
        }


            let percentage = 100 * (tapInTrueCounter / totalTapQuestions)
            let obj = {date:date, percentage: percentage}

            weekObj.append(obj)

        }));




        res.status(201).json(weekObj)




    }
    catch(err) {
        return res.status(500).json({message: err.message})
    }
})









//**************************************************************************************** */


//CLASS ROUTES


//

//Get daily completion percentage of TapIns for a Class of students
router.get('/classDailyCompletion/:classID', async  (req, res, next) => {
    try{
        //First get all students for a teachers class, extract array of student obj id's from request body
        let classID  = req.params.classID;
        

        let classOfStudents = await classStudentModel.find({classID: classID})


        
       

        let dailyTapIns = await Promise.all( classOfStudents.map(async function(student) {
            await tapInModel.find({student: student.studentID , date: getDateString()})
        }));



        let percentage =  100 * (dailyTapIns / classOfStudents.length )

        res.status(201).json(percentage)

    }
    catch(err) {
        return res.status(500).json({message: err.message})
    }
});









///CONTINUE FIXING STUFF HERE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!



//Get array of daily completion data for all classes of a teacher

router.get('/allClassesDailyCompletion/:staffID', async (req, res) => {

    try
    {


        let staffID  = req.params.staffID;
        let foundStaffMember = await staffModel.find({_id: staffID});
        let classPercentageArr = [];


        let firstClass = await classModel.find({staffID: foundStaffMember._id, hour: "firstHour"});


        //Look at class/student table


        let students = await classStudentModel.find({classID: firstClass[0]._id})



     let dailyTapIns =  await Promise.all( students.map(async function (student) {
        await tapInModel.find({student: student.studentID, date: getDateString()})
    }));
    
    let percentage =  100 * (dailyTapIns / (students.length - 1));

    let obj1 = {percentage: percentage, class: "firstHour"}

    classPercentageArr.append(obj1);


///////////////////////////////////////////////////////////////////////////////////////////////


let secondClass = await classModel.find({staffID: foundStaffMember._id, hour: "secondHour"});

let students2 = await classStudentModel.find({classID: secondClass[0]._id});


 let dailyTapIns2 = await Promise.all( students2.map(async function (student) {
    await tapInModel.find({student: student.studentID, date: getDateString()})
}));

let percentage2 =  100 * (dailyTapIns2 / students2.length );

let obj2 = {percentage: percentage2, class: "secondHour"}

classPercentageArr.append(obj2);


//////////////////////////////////////////////////////////////////////////////////////////////////


let thirdClass = await classModel.find({staffID: foundStaffMember._id, hour: "thirdHour"});

let students3 = await classStudentModel.find({classID: thirdClass[0]._id});



let dailyTapIns3 = await Promise.all( students3.map(async function (student) {
await tapInModel.find({student: student.studentID, date: getDateString()})
}));

let percentage3 =  100 * (dailyTapIns3 / students3.length );

let obj3 = {percentage:percentage3, class: "thirdHour"}

classPercentageArr.append(obj3);


//////////////////////////////////////////////////////////////////////////////////////////////////////

let fourthClass = await classModel.find({staffID: foundStaffMember._id, hour: "fourthHour"});


let students4 = await classStudentModel.find({classID: fourthClass[0]._id})




let dailyTapIns4 =  await Promise.all(students4.map(async function (student) {
await tapInModel.find({student: student.studentID, date: getDateString()})
}));

let percentage4 =  100 * (dailyTapIns4 / students4.length);

let obj4 = {percentage:percentage4, class: "fourthHour"}

classPercentageArr.append(obj4);



////////////////////////////////////////////////////////////////////////////////////


let fifthClass = await classModel.find({staffID: foundStaffMember._id, hour: "fifthHour"});


let students5 = await classStudentModel.find({classID: fifthClass[0]._id});




let dailyTapIns5 = await Promise.all( students5.map(async function (student) {
await tapInModel.find({student: student.studentID, date: getDateString()})
}));

let percentage5 =  100 * (dailyTapIns5 / students5.length );

let obj5 = {percentage:percentage5, class: "fifthHour"}

classPercentageArr.append(obj5);

///////////////////////////////////////////////////////////////////////////////////////



let sixthClass = await classModel.find({staffID: foundStaffMember._id, hour: "sixthHour"});



let students6 = await classStudentModel.find({classID: sixthClass[0]._id});


let dailyTapIns6 = await Promise.all(students6.map(async function (student) {
await tapInModel.find({student: student.studentID, date: getDateString()})
}));

let percentage6 =  100 * (dailyTapIns6 / students6.length );

let obj6 = {percentage:percentage6, class: "sixthHour"}

classPercentageArr.append(obj6);


//////////////////////////////////////////////////////////////////////////////////////////////////////

let seventhClass = await classModel.find({staffID: foundStaffMember._id, hour: "seventhHour"});


let students7 = await classStudentModel.find({classID: seventhClass[0]._id});





let dailyTapIns7 = await Promise.all( students7.map(async function (student) {
await tapInModel.find({student: student.studentID, date: getDateString()})
}));

let percentage7 =  100 * (dailyTapIns7 / students7.length);

let obj7 = {percentage:percentage7, class: "seventhHour"}

classPercentageArr.append(obj7);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////





let eigthClass = await classModel.find({staffID: foundStaffMember._id, hour: "eigthHour"});


let students8 = await classStudentModel.find({classID: eigthClass[0]._id});





let dailyTapIns8 =  await Promise.all(students8.map(async function (student) {
await tapInModel.find({student: student.studentID, date: getDateString()})
}));

let percentage8 =  100 * (dailyTapIns8 / students8.length );

let obj8 = {percentage: percentage8, class: "eigthHour"}

classPercentageArr.append(obj8);











/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

return res.status(201).json(classPercentageArr)


    }
    catch(err) {
        return res.status(500).json({message: err.messsage})
    }

});










//Get Last 5 Days completion percentage of TapIns for a class
router.get('/classFiveDayCompletion/:classID', async (req, res) => {

try{
    //First get all students for a teachers class, extract array of student obj id's from request body
    
    let classID  = req.body.classID;
    

    let students = await classStudentModel.find({classID: classID});

    
    
   

    let datesArr = getLastFiveWeekdays();

    let weekObj = [];

    datesArr.forEach(async function(date) {

        let dailyTapIns = await Promise.all( students.map(async function(student) {
            await tapInModel.find({student: student.studentID, date: date})
        }))


        let percentage = 100 * (dailyTapIns / students.length)

        let obj = {date: date, percentage: percentage}


        weekObj.append(obj)
    });



    res.status(201).json(weekObj)




}

catch(err) {
    return res.status(500).json({message: err.message})
}


});



//Get daily results percentage of TapIns for a Class of students

router.get('/classDailyResult/:classID', async (req, res) => {
    try{

        let classID  = req.body.classID;
       

        let students = await classStudentModel.find({classID: classID})

       


        let dailyTapIns =  await Promise.all( students.map(async function(student) {
            await tapInModel.find({student: student.studentID, date: getDateString()})
        }));


        let totalTapQuestions = dailyTapIns * 3;

        let tapInTrueCounter = 0;

        for(let obj of dailyTapIns) {
            if(obj.eating == true) {tapInTrueCounter++}
            if(obj.sleeping == true) {tapInTrueCounter++}
            if(obj.wellBeing == true) {tapInTrueCounter++}
        }


        let percentage = 100 * (tapInTrueCounter / totalTapQuestions)


        res.status(201).json(percentage)







    }




    catch(err) {

        return res.status(500).json({message: err.message})
    }
});








//Get array of daily results for all classes for a teacher
router.get('/allClassesDailyResult/:staffID', async (req, res) => {
    try
    {

        let staffID  = req.params.staffID;
        let foundStaffMember = await staffModel.find({_id: staffID});
        let classPercentageArr = [];


        let firstClass = await classModel.find({staffID: foundStaffMember[0]._id, hour: "firstHour"});


        let students = await classStudentModel.find({classID: firstClass[0]._id})

        let dailyTapIns =  await Promise.all( students.map(async function(student) {
            await tapInModel.find({student: student.studentID, date: getDateString()})
        }));


        let totalTapQuestions = dailyTapIns * 3;

        let tapInTrueCounter = 0;

        for(let obj of dailyTapIns) {
            if(obj.eating == true) {tapInTrueCounter++}
            if(obj.sleeping == true) {tapInTrueCounter++}
            if(obj.wellBeing == true) {tapInTrueCounter++}
        }


        let percentage = 100 * (tapInTrueCounter / totalTapQuestions);

        let obj1 = {percentage: percentage, class: "firstClass"};


        classPercentageArr.append(obj1)

/////////////////////////////////////////////////////////////////////////////////////////////



    let secondClass = await classModel.find({staffID: foundStaffMember[0]._id, hour: "secondHour"});

        let students2 = await classStudentModel.find({classID: secondClass[0].studentID })

        let dailyTapIns2ndClass =  await Promise.all(students2.map(async function(student) {
            await tapInModel.find({student: student.studentID, date: getDateString()})
        }) );


        let totalTapQuestions2ndClass = dailyTapIns2ndClass * 3;

        let tapInTrueCounter2ndClass = 0;

        
        for(let obj of dailyTapIns2ndClass) {
            if(obj.eating == true) {tapInTrueCounter2ndClass++}
            if(obj.sleeping == true) {tapInTrueCounter2ndClass++}
            if(obj.wellBeing == true) {tapInTrueCounter2ndClass++}
        }


        let percentage2ndClass = 100 * (tapInTrueCounter2ndClass / totalTapQuestions2ndClass);


        let obj2 = {percentage: percentage2ndClass, class: "secondClass"};

        classPercentageArr.append(obj2)


/////////////////////////////////////////////////////////////////////////////////////////////////////////////



let thirdClass = await classModel.find({staffID: foundStaffMember[0]._id, hour: "thirdHour"});

let students3 = await classStudentModel.find({classID: thirdClass[0].studentID })






        let dailyTapIns3rdClass = await Promise.all( students3.map(async function(student) {
            await tapInModel.find({student: student.studentID, date: getDateString()})
        }));


        let totalTapQuestions3rdClass = dailyTapIns3rdClass * 3;

        let tapInTrueCounter3rdClass = 0;

           
        for(let obj of dailyTapIns3rdClass) {
            if(obj.eating == true) {tapInTrueCounter3rdClass++}
            if(obj.sleeping == true) {tapInTrueCounter3rdClass++}
            if(obj.wellBeing == true) {tapInTrueCounter3rdClass++}
        }


        let percentage3rdClass = 100 * (tapInTrueCounter3rdClass / totalTapQuestions3rdClass);

        let obj3 = {percentage: percentage3rdClass, class: "thirdClass"};

        classPercentageArr.append(obj3)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let fourthClass = await classModel.find({staffID: foundStaffMember[0]._id, hour: "fourthHour"});

let students4 = await classStudentModel.find({classID: fourthClass[0].studentID })






let dailyTapIns4thClass = await Promise.all( students4.map(async function(student) {
    await tapInModel.find({student: student.studentID, date: getDateString()})
}));


let totalTapQuestions4thClass = dailyTapIns4thClass * 3;


let tapInTrueCounter4thClass = 0;





for(let obj of dailyTapIns4thClass) {
    if(obj.eating == true) {tapInTrueCounter4thClass++}
    if(obj.sleeping == true) {tapInTrueCounter4thClass++}
    if(obj.wellBeing == true) {tapInTrueCounter4thClass++}
}



let percentage4thClass = 100 * (tapInTrueCounter4thClass / totalTapQuestions4thClass);

let obj4 = {percentage: percentage4thClass, class: "fourthClass"};


classPercentageArr.append(obj4)



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




let fifthClass = await classModel.find({staffID: foundStaffMember[0]._id, hour: "fifthHour"});

let students5 = await classStudentModel.find({classID: fifthClass[0].studentID })




let dailyTapIns5thClass = await Promise.all( students5.map(async function(student) {
    await tapInModel.find({student: student.studentID, date: getDateString()})
}));

let totalTapQuestions5thClass = dailyTapIns5thClass * 3;

let tapInTrueCounter5thClass = 0;



for(let obj of dailyTapIns5thClass) {
    if(obj.eating == true) {tapInTrueCounter5thClass++}
    if(obj.sleeping == true) {tapInTrueCounter5thClass++}
    if(obj.wellBeing == true) {tapInTrueCounter5thClass++}
}


let percentage5thClass = 100 * (tapInTrueCounter5thClass / totalTapQuestions5thClass);

let obj5 = {percentage: percentage5thClass, class: "fifthClass"};

classPercentageArr.append(obj5)


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


let sixthClass = await classModel.find({staffID: foundStaffMember[0]._id, hour: "sixthHour"});

let students6 = await classStudentModel.find({classID: sixthClass[0].studentID })




let dailyTapIns6thClass = await Promise.all( students6.map(async function(student) {
    await tapInModel.find({student: student.studentID, date: getDateString()})
}));


let totalTapQuestions6thClass = dailyTapIns6thClass * 3;

let tapInTrueCounter6thClass = 0;

for(let obj of dailyTapIns6thClass) {
    if(obj.eating == true) {tapInTrueCounter6thClass++}
    if(obj.sleeping == true) {tapInTrueCounter6thClass++}
    if(obj.wellBeing == true) {tapInTrueCounter6thClass++}
}



let percentage6thClass = 100 * (tapInTrueCounter6thClass / totalTapQuestions6thClass);


let obj6 = {percentage: percentage6thClass, class: "sixthClass"}


classPercentageArr.append(obj6)



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


let seventhClass = await classModel.find({staffID: foundStaffMember[0]._id, hour: "seventhHour"});

let students7 = await classStudentModel.find({classID: seventhClass[0].studentID })





let dailyTapIns7thClass = await Promise.all( students7.map(async function(student) {
    await tapInModel.find({student: student.studentID, date: getDateString()})
}));


let totalTapQuestions7thClass = dailyTapIns7thClass * 3;


let tapInTrueCounter7thClass = 0;



for(let obj of dailyTapIns7thClass) {
    if(obj.eating == true) {tapInTrueCounter7thClass++}
    if(obj.sleeping == true) {tapInTrueCounter7thClass++}
    if(obj.wellBeing == true) {tapInTrueCounter7thClass++}
}



let percentage7thClass = 100 * (tapInTrueCounter7thClass / totalTapQuestions7thClass);

let obj7 = {percentage: percentage7thClass, class: "seventhClass"};

classPercentageArr.append(obj7);


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////








let eigthClass = await classModel.find({staffID: foundStaffMember[0]._id, hour: "eigthHour"});

let students8 = await classStudentModel.find({classID: eigthClass[0].studentID })





let dailyTapIns8thClass = await Promise.all(students8.map(async function(student) {
    await tapInModel.find({student: student.studentID, date: getDateString()})
}));


let totalTapQuestions8thClass = dailyTapIns7thClass * 3;


let tapInTrueCounter8thClass = 0;



for(let obj of dailyTapIns8thClass) {
    if(obj.eating == true) {tapInTrueCounter8thClass++}
    if(obj.sleeping == true) {tapInTrueCounter8thClass++}
    if(obj.wellBeing == true) {tapInTrueCounter8thClass++}
}



let percentage8thClass = 100 * (tapInTrueCounter8thClass / totalTapQuestions8thClass);

let obj8 = {percentage: percentage8thClass, class: "eigthClass"};

classPercentageArr.append(obj8);






/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

res.status(201).json(classPercentageArr)


    }

    catch(err)
    {return res.status(500).json({message: err.message})}
});






//Get Last 5 Days results percentage of TapIns for a Class of students




router.get('classFiveDayResult/:classID', async (req, res) => {
    try{

        let classID = req.params.classID;

        let students = await classStudentModel.find({classID: classID})
        let datesArr = getLastFiveWeekdays();

        let weekObj = [];
        let totalTapQuestions;




        datesArr.forEach(async function(date) {

            let dailyTapIns = await Promise.all( students.map(async function (student) {

                await tapInModel.find({student: student.studentID, date: date})

            }))


            totalTapQuestions = dailyTapIns.length * 3;
            let tapInTrueCounter = 0;

            for(let obj of dailyTapIns) {
                if(obj.eating == true) {tapInTrueCounter++}
                if(obj.sleeping == true) {tapInTrueCounter++}
                if(obj.wellBeing == true) {tapInTrueCounter++}
            }

            let percentage = 100 * (tapInTrueCounter / totalTapQuestions)
            let obj = {date: date, percentage: percentage}

            weekObj.append(obj)




        });

        res.status(201).json(weekObj)






    }


    catch(err) {
        return res.status(500).json({message: err.message})
    }
});








//********************************************************************************************* */









//HRT Routes
//Get daily completion percentage of TapIns for HRT

router.get('/hrtDailyCompletion/:staffID', async (req, res) => {
    try{

        //hrt is the name of the teacher
        let hrt = req.params.staffID;
        let foundStudents = await studentModel.find({hrt: hrt});


        let dailyTapIns = await Promise.all( foundStudents.map(async function(student) {
            await tapInModel.find({student: student._id, date: getDateString()})
        }));


        let percentage = 100 * (dailyTapIns / foundStudents.length )

        res.status(201).json(percentage)



    }

    catch(err) {
        return res.status(500).json({message: err.message})
    }
});





//Get Last 5 Days completion percentage for a HRT

router.get('/hrtFiveDayCompletion/:staffID', async (req, res) => {

    try{

        let hrt = req.params.staffID;
        //Pull array of students based on HRT
        let foundStudents = await studentModel.find({hrt: hrt});
        
        let datesArr = getLastFiveWeekdays();
        let weekObj = [];



        datesArr.forEach(async function(date) {


            let dailyTapIns = await Promise.all(foundStudents.map(async function(student) {
                await tapInModel.find({student: student._id, date: date})
            }));

            let percentage = 100 * (dailyTapIns / foundStudents.length)

            let obj = {date: date, percentage: percentage}


            weekObj.append(obj)
        });




        res.status(201).json(weekObj)

    }

    catch(err)
    {return res.status(500).json({message: err.message})}

});








//Get daily results percentage of TapIns for HRT


router.get('/hrtDailyResult/:staffID', async(req, res) => {
    try{
        let staffID = req.params.staffID;

        let students = await studentModel.find({hrt: staffID})

       

        let dailyTapIns = students.map(async function(student) {
            await tapInModel.find({student: student._id, date: getDateString()})
        });


        let totalTapQuestions = dailyTapIns * 3;

        let tapInTrueCounter = 0;

        for(let obj of dailyTapIns) {
            if(obj.eating == true) {tapInTrueCounter++}
            if(obj.sleeping == true) {tapInTrueCounter++}
            if(obj.wellBeing == true) {tapInTrueCounter++}
        }

        let percentage = 100 * (tapInTrueCounter / totalTapQuestions)

        res.status(201).json(percentage)

    }

    catch(err)
    {return res.status(500).json({message: err.message})}
});






//Get Last 5 Days results percentage of TapIns for HRT


router.get('/hrtFiveDayResult/:staffID', async (req, res) =>{
    try{

        let staffID = req.params.staffID;

       let students = await studentModel.find({hrt: staffID}) 

        let datesArr = getLastFiveWeekdays();
        let weekObj = [];
        let totalTapQuestions;


        datesArr.forEach(async function(date) {

            let dailyTapIns = students.map(async function(student) {

                await tapInModel.find({student: student._id, date: date})
            });

            totalTapQuestions = dailyTapIns * 3;
            let tapInTrueCounter = 0;

            for(let obj of dailyTapIns) {
                if(obj.eating == true) {tapInTrueCounter++}
                if(obj.sleeing == true) {tapInTrueCounter++}
                if(obj.wellBeing == true) {tapInTrueCounter++}
            }

            let percentage = 100 * (tapInTrueCounter / totalTapQuestions)
            let obj = {date: date, percentage: percentage}

            weekObj.append(obj)



        });



        res.status(201).json(weekObj)


    }

    catch(err)
    {return res.status(500).json({message: err.message})}
});







////Fixes Start Here !!!!!!!!!!!!!!!!!!!!!!!!!

//**************************************************************************************************************** */






//Counselor Routes
//Get daily completion percentage of TapIns for counselor

router.get('/counselorDailyCompletion', async (req, res) => {
    try{
        //Extract counselor ID from body
        let counselor = req.body;
        let foundStudents = await studentModel.find({counselor: counselor});
        let dailyTapIns = foundStudents.map(async function(student) {
            await tapInModel.find({student: student._id, date: getDateString()})
        });

        let percentage = 100 * (dailyTapIns / foundStudents.length);

        res.status(201).json(percentage)
    }


    catch(err) {
        return res.status(500).json({message: err.message})
    }
});


//Get Last 5 Days completion percentage of TapIns for counselor

router.get('/counselorFiveDayCompletion', async (req, res) => {
    try{

    //First get all students for a teachers class, extract array of student obj id's from request body
    let studentRefObj = req.body;

    let students = studentRefObj.map(async function (id) {
        await studentModel.find({_id: id})
    });

    let datesArr = getLastFiveWeekdays();

    let weekObj = [];



    datesArr.forEach(async function(date) {

        let dailyTapIns = students.map(async function(student) {
            await tapInModel.find({student: student._id, date: date})
        });


        let percentage = 100 * (dailyTapIns / foundStudent.length);

        let obj = {date: date, percentage: percentage};

        weekObj.append(obj)

    });


res.status(201).json(weekObj)


    }

    catch(err)

    {return res.status(500).json({message: err.message})}
});




//Get daily Results percentage for a counselor

router.get('/counselorDailyResult', async (req, res) => {
    try{

        let studentRefObj = req.body;
        let students = studentRefObj.map(async function(id) {
            await studentModel.find({_id: id})
        });



        let dailyTapIns = students.map(async function(student) {
            await tapInModel.find({student: student._id, date: getDateString()})
        });


        totalTapInQuestions = dailyTapIns * 3;

        let tapInTrueCounter = 0;


        for(let obj of dailyTapIns) {
            if(obj.eating == true) {tapInTrueCounter++}
            if(obj.sleeping == true) {tapInTrueCounter++}
            if(obj.wellBeing == true) {tapInTrueCounter++}
        }

        let percentage = 100 * (tapInTrueCounter / totalTapQuestions);

        res.status(201).json(percentage)


    }


    catch(err)
    {return res.status(500).json({message: err.message})}
});



//Get Last 5 Days results percenrtage of TapIns for Counselor


router.get('/counselorFiveDayResult', async(req, res) => {
    try{

        let studentRefObj = req.body;

        let students = studentRefObj.map(async function(id) {
            await studentModel.find({_id: id})
        });

        let datesArr = getLastFiveWeekdays();


        let weekObj = [];

        let totalTapQuestions;


        datesArr.forEach(async function(date) {

            let dailyTapIns = students.map(async function (student) {

               await tapInModel.find({student: student._id, date: date}) 

            });


            totalTapQuestions = dailyTapIns * 3;
            let tapInTrueCounter = 0;

            for(let obj of dailyTapIns) {
                if(obj.eating == true) {tapInTrueCounter++}
                if(obj.sleeping == true) {tapInTrueCounter++}
                if(obj.wellBeing == true) {tapInTrueCounter++}
            }

            let percentage = 100 * (tapInTrueCounter / totalTapQuestions);
            let obj = {date: date, percentage: percentage}



            weekObj.append(obj)





        });


        res.status(201).json(weekObj)

    }

    catch(err)
    {return res.status(500).json({message: err.message})}
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


//Generates current date in format   
//Date Format: Mon Feb 20 2023
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

//console.log(assignCurrentDate())




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
  
  console.log(getDateString())

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
  
  

  
  
  



  console.log(getLastFiveWeekdays())




function getLastWeeksDates() {
    const now = new Date();
  
   let currentDay =  new Date(now.getFullYear(), now.getMonth(), now.getDate()).toUTCString();
   let oneDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toUTCString();
   let twoDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).toUTCString();
   let threeDay =  new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3).toUTCString();
   let fourDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4).toUTCString();
    let fiveDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5).toUTCString();
    let sixDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toUTCString();
     

     let datesArr = [currentDay, oneDay, twoDay, threeDay, fourDay, fiveDay, sixDay]

     console.log(datesArr[0], datesArr[1])
     return datesArr.map(function(date) {
        
       let split = date.split(" ")
       split.pop();
       split.pop()
       let joinedDate = split.join(" ")
       

       return joinedDate
     })


     

  }





    module.exports = router


