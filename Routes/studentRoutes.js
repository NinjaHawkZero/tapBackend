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








//REGISTER STUDENT FOR SCHOOL
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
            let createdStudent = await studentModel.create({name:name, email: email,  passcode: passcode, schoolID: school, grade: grade, flagged: false})
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










//LOGIN STUDENT

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








    




//CLASS ONBOARDING
//CREATE CLASS, STUDENT, STAFF RELATIONSHIPS, WITH CLASS ONBOARDING PAGE DATA

router.post(`/onboarding/:schoolID`, async (req, res) => {
    try {
        let studentID = req.body.studentID;
        let hours = ["firstHour", "secondHour", "thirdHour", "fourthHour", "fifthHour", "sixthHour", "seventhHour", "eighthHour"];
        
        // Helper function to create classStudentModel
        const createClassStudentModel = async (hour, bodyHour) => {
            if (req.body[bodyHour].length > 0) {
                let hourStaff = req.body[bodyHour][0];
                let classID = await classModel.find({staffID: hourStaff._id, hour: hour});
                if (classID.length > 0) {
                    let classStudentObj = await classStudentModel.create({classID: classID[0]._id, studentID: studentID, staffID: hourStaff._id});
                    await classStudentObj.save();
                } else {
                    throw new Error(`Could not find class with staffID ${hourStaff._id} and hour ${hour}`);
                }
            }
        }

        // Iterate over hours and create classStudentModel for each hour
        for (let i = 0; i < hours.length; i++) {
            await createClassStudentModel(hours[i], hours[i]);
        }
        
        // Find the student once and reuse it
        let foundStudent = await studentModel.findOne({_id: studentID});
        if (!foundStudent) {
            throw new Error(`Could not find student with ID ${studentID}`);
        }

        // Update the student's HRT and counselor
        if (req.body.selectedHRT.length > 0) {
            foundStudent.hrt = req.body.selectedHRT[0]._id;
        }
        if (req.body.selectedCounselor.length > 0) {
            foundStudent.counselor = req.body.selectedCounselor[0]._id;
        }
        await foundStudent.save();
        
        res.status(201).json({student: foundStudent});
    } catch(err) {
        res.status(400).json({message: err.message});
    }
});






//GETTING ALL STUDENTS FOR A SCHOOL
router.get('/getAllStudents/:schoolID', async (req, res) => {

    try{
        let foundStudents = await studentModel.find({schoolID: req.params.schoolID})
        res.status(201).json(foundStudents)
    }

    catch(err) {res.status(400).json({message: err.message})}
    
    });
    




//UPDATES STUDENTS REVIEWED
//TAKES ARRAY OF STUDENTS REVIEWED, RETURNS SUCCESS MESSAGE
router.post('/studentsReviewed', async (req, res) => {
    try {
      const studentReviews = req.body.studentReview;
  
      const studentPromises = studentReviews.map(async (student) => {
        await studentModel.findByIdAndUpdate(student._id, student);
      });
  
      await Promise.all(studentPromises);
  
      res.status(200).json({ message: "You submitted your reviews!" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });





//GETTING ONE STUDENT 
router.get('/:_id',  async (req, res) => {

        try{

            let student = await studentModel.find({_id: req.params._id});
            let member = student[0]
            res.status(201).json(member)
            
        }

        catch(err)
   { res.status(400).json({message: err.message})}
    });
    








    




    
//UPDATING ONE
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



    
//DELETE ONE
    router.delete('/:_id', getStudent, async (req, res) => {

        try{
            await res.student.remove()
            res.json({message: "Deleted Student"})
        }

        catch(err) {
            res.status(500).json({message: err.message})
        }

    
    
    });




//STUDENT MIDDLEWARE
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