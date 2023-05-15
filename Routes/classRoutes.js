const express = require('express');
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require('../config');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {ExpressError} = require("../expressError")
const { schoolModel } = require('../SchoolModels');
const router = express.Router()
const { classModel} = require("../ClassModel")
const { studentModel} = require("../StudentModel")






//Getting All Classes for a School

router.get(`/allSchoolClasses/:schoolID`, async (req, res) => {


    try{
    
    
        let schoolID = req.params.schoolID
        
        let foundClasses = await classModel.find({schoolID: schoolID})
       
        
        if(foundClasses.length > 0) {
            res.status(201).json(foundClasses)
        } else {
            throw new ExpressError(`No classes found for school`)
        }
    
    }
    catch(err)
    {res.status(400).json({message: err.message})}
    
    
    
    
    });




//Getting All Classes for a teacher

router.get(`/allTeacherClasses/:staffID`, async (req, res) => {

try{

let staffID = req.params.staffID;
let foundClasses = await classModel.find({staffID: staffID})

if(foundClasses.length > 0) {
    res.status(201).json(foundClasses)
}

else {throw new ExpressError('Could not find classes for teacher')}

}

catch(err)

{res.status(400).json({message: "Could not retrieve Classes for teacher"})}


});



//Getting All Classes for a Student

router.get(`/allStudentClasses/:studentID`, async (req, res) => {

try{

let studentID = req.params.studentID;

let foundStudent = await studentModel.find({_id: studentID})

if(foundStudent.length > 0) {

    let student = foundStudent[0];
    //Array of class ids
    let classIDS = student.classes

    //Loop over classIDS and 
   let classes = classIDS.map(async function(classID)  {

        await classModel.find({_id: classID})
    })

    res.status(201).json({classes})

} else {
    throw new ExpressError("Could not find student")
}




}
catch(err)
{res.status(400).json({message:"Could not retrieve classes for student"})}

});


module.exports = router

