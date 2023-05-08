const express = require('express');
const { SECRET_KEY } = require('../config');
const router = express.Router()
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {ExpressError} = require("../expressError")
const {studentModel} = require("../StudentModel")
const {schoolModel} = require("../SchoolModels")
const {staffModel} = require("../StaffModel")
const {classStudentModel} = require("../ClassStudent")
const {classModel} = require("../ClassModel")


//Getting All
router.get('/getAllStudents/:schoolID', async (req, res) => {

    try{
        let foundStudents = await studentModel.find({schoolID: req.params.schoolID})
        res.status(201).json(foundStudents)
    }

    catch(err) {res.status(400).json({message: err.message})}
    
    });
    




    
    //Getting One
router.get('/:_id',  async (req, res) => {

        try{

            let student = await studentModel.find({_id: req.params._id});
            res.status(201).json(student)
            
        }

        catch(err)
   { res.status(400).json({message: err.message})}
    });
    


//Register Student

router.post('/register', async(req, res ) => {

    try{
        //Also need hrt and counselor
        let {name,  email,  passcode, schoolCode, grade} = req.body;
        let foundStudent = await studentModel.find({email: email});
        let foundSchool = await schoolModel.find({schoolCode: schoolCode})
        

        if(foundStudent.length > 0) {
            throw new ExpressError(`This email is already in use`)
        } 

        if(foundSchool.length > 0) {
            //Create student, add to db
            let school = foundSchool[0]._id
            let createdStudent = await studentModel.create({name:name, email: email,  passcode: passcode, schoolID: school, grade: grade})
            const savedStudent = await createdStudent.save()

            console.log(`the saved student is ${savedStudent}`)

            const token = jwt.sign(email, SECRET_KEY)

            res.status(201).json({savedStudent, token})


        } else {
            throw new ExpressError(`An account for schoolCode ${schoolCode} does not exist`)
        }

    }
    catch(err) {res.status(400).json({message: err.message})}
});


//Login Student

router.post('/login', async(req, res) => {
    try{
        let{email, passcode} = req.body;
        let foundStudent = await studentModel.find({email:email});

        if(foundStudent.length > 0) {

            if(foundStudent[0].passcode === passcode) {
                let email = foundStudent.email;
                let token = jwt.sign({email}, SECRET_KEY)
                console.log(token)
                console.log(foundStudent)
                return res.json({token, foundStudent})
            }

            else {
                throw new ExpressError(`Incorrect passcode ${passcode} for email ${email}`)
            }

        } else {
            throw new ExpressError(`No student with email address ${email} was found`)
        }


    }
    catch(err) {res.status(400).json({message: err.message})}
});








    
    
//Return Arrays of {teacherName: "dfdfd", classes: [{classObj}]} and an array of counselors

router.get(`/onBoarding/:schoolID`, async (req, res) => {
try{

    let schoolID = req.params.schoolID;
    let foundTeacherArr = await staffModel.find({_id: schoolID, title: "Teacher"});
    let foundCounselorArr = await staffModel.find({_id: schoolID, title: "Counselor"});

    if(foundTeacherArr.length > 0  && foundCounselorArr.length > 0) {

        let teacherClassArr = [];

        foundTeacherArr.forEach(async function(teacher)  {

            let obj = {teacherName: "", classes:[]}

            let teacherClasses = await classModel.find({staffID: teacher.staffID})

            obj.classes = teacherClasses
            obj.teacherName = teacher.name

            teacherClassArr.push(obj)



        });




        res.status(201).json({teacherClassArr, foundCounselorArr})
    }
 else {
    throw new ExpressError("Could not retrieve Staff for school")
 }

}
catch(err) {
    res.status(400).json({message: err.message})
}

});






//Class Onboarding
//Create class, student, teacher relationships, on class onboarding page for students
router.post(`/onboarding/:schoolID`, async (req, res) =>{

    try
    {

    //Body should also contain HRT and Counselor variables to set on the student
    let classStudentArr = req.body.classStudentArr;
    let HRT = req.body.HRT;
    let Counselor = req.body.counselor;

    //TODO: Look up student and add teacher and counselor to student, save student
    

    //Create Class/Student/Staff relationship
    classStudentArr.forEach( async function(obj) {
    
        let relationship = await classStudentModel.create(obj)
    
        await relationship.save()
    
    });
    
    
    
    }
    
    catch(err)
    {}
    
    });







    
    //Updating one
    router.patch('/:_id', getStudent, async (req, res) => {
    
    

        try{
            let editedStudent = req.body
            const updatedStudent = await studentModel.findOneAndUpdate({type: req.params._id}, editedStudent, {new: true})
            res.status(201).json(updatedStudent)
        }

        catch(err) {
            res.status(400).json({message: err.message})
        }
    
    
    });



    
    //Delete one
    router.delete('/:_id', getStudent, async (req, res) => {

        try{
            await res.student.remove()
            res.json({message: "Deleted Student"})
        }

        catch(err) {
            res.status(500).json({message: err.message})
        }

    
    
    });





    async function getStudent(req, res, next) {
        let student;

        try{
            student = await studentModel.findById(req.params.id);
            if(student == null) {
                return res.status(404).json({message: "Cannot find student."})
            }
            
        }

        catch(err) {
            return res.status(500).json({messsage: err.message})
        }

        res.student = student
        next()
    };



    module.exports = router