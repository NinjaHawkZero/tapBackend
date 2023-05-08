const express = require('express');
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require('../config');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {ExpressError} = require("../expressError")
const { schoolModel } = require('../SchoolModels');
const router = express.Router()
const { staffModel} = require("../StaffModel")
const { classModel} = require("../ClassModel")




//Getting All
router.get('/:schoolID', async (req, res) => {

    try{
        let schoolID = req.params.schoolID
        let foundStaff = await staffModel.find({schoolID: schoolID})
        res.status(201).json(foundStaff)
    }

    

    catch(err) {
        res.status(400).json({message: err.message})
    
    }});
    
    





    //Getting One
    router.get('/:_id',  async (req, res) => {

        try{
            let staffMember = await staffModel.find({_id: req.params._id})
            res.status(201).json(staffMember)
        }
catch(err) {res.status(400).json({message: err.message})}

  
    });
    
    




    //Getting All Teachers
    router.get('/teachers/:schoolID', async (req, res) => {
        try{
            let foundStaff = await staffModel.find({schoolID: req.params.schoolID})
            let teacherArr = [];
            let teachers = foundStaff.forEach(function (staffMember) {
                if(staffMember.title === "Teacher" || staffMember.title === 'teacher') {
                    teacherArr.push(staffMember)
                }
            })

            
            res.status(201).json(teacherArr)

        }
        catch(err) {
            res.status(400).json({message: err.message})
        }
        

    })





    //Getting All Counselors

    router.get('/counselors/:schoolID', async (req, res) => {
        try{
            let foundStaff = await staffModel.find({schoolID: req.params.schoolID});
            let counselorArr = [];
            let counselors = foundStaff.forEach( function(staffMember) {
                if(staffMember.title === 'Counselor' || staffMember.title === 'counselor') {
                    counselorArr.push(staffMember)
                }
            });
            
            res.status(201).json(counselorArr)
        }

        catch(err) {
            res.status(400).json({message: err.message})
        }
    } )





//Register staff
router.post('/register', async (req,res) => {
    try{
        let {schoolCode, name, title, password, email} = req.body;

        
        //Find school
        let foundSchool = await schoolModel.find({schoolCode: schoolCode})
        let foundStaff = await staffModel.find({email: email})
        //If found school is true
        if(foundSchool.length > 0) {
            



        if(foundStaff.length > 0) {
            throw new ExpressError(`This email is already in use`)
        }


        else {
        //Store school id
        let schoolID = foundSchool[0]._id     
        //Hash Password
        const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

        //Create new staff member
        let newStaffMember = await staffModel.create({schoolID: schoolID, schoolCode: schoolCode, name: name, password: hashedPassword, title: title, email: email });


        if(newStaffMember.title === "Teacher"  || newStaffMember.title === "teacher")

        {
       
        let firstClass = await classModel.create({staffID: newStaffMember._id, schoolID: newStaffMember.schoolID, className: "Class 1", hour: "firstHour"});
        await firstClass.save();

        let secondClass = await classModel.create({staffID: newStaffMember._id, schoolID: newStaffMember.schoolID, className: "Class 2", hour: "secondHour"});
        await secondClass.save();

        let thirdClass = await classModel.create({staffID: newStaffMember._id, schoolID: newStaffMember.schoolID, className: "Class 3", hour: "thirdHour"});
        await thirdClass.save();

        let fourthClass = await classModel.create({staffID: newStaffMember._id, schoolID: newStaffMember.schoolID, className: "Class 4", hour: "fourthHour"});
        await fourthClass.save();

        let fifthClass = await classModel.create({staffID: newStaffMember._id, schoolID: newStaffMember.schoolID, className: "Class 5", hour: "fifthHour"});
        await fifthClass.save();

        let sixthClass = await classModel.create({staffID: newStaffMember._id, schoolID: newStaffMember.schoolID, className: "Class 6", hour: "sixthHour"});
        await sixthClass.save();

        let seventhClass = await classModel.create({staffID: newStaffMember._id, schoolID: newStaffMember.schoolID, className: "Class 7", hour: "seventhHour"});
        await seventhClass.save();

        let eigthClass = await classModel.create({staffID: newStaffMember._id, schoolID: newStaffMember.schoolID, className: "Class 8", hour: "eigthHour"});
        await eigthClass.save();


        }

        //Save staff member
        const savedStaffMember = await newStaffMember.save()

        console.log(`the saved staff member is ${savedStaffMember}`)
        //Generate token
        const token = jwt.sign(savedStaffMember._id, SECRET_KEY );

        res.status(201).json({savedStaffMember, token})
        }

        }
        else {
            throw new ExpressError(`Could not find school with SchoolCode ${schoolCode}`)
        }
        

        
    }
    catch(err) {res.status(400).json({message: err.message})}
});




//Login Staff
router.post('/login', async (req, res) => {
    try {
        //extract login data
        let { password, email} = req.body;

        //Check db for user info combo
        let foundUser = await staffModel.find({email: email});

        if(foundUser.length > 0) {
            let isValid = await bcrypt.compare(password, foundUser[0].password)

            if(isValid === true) {
                delete foundUser[0].password;
                let userEmail = foundUser[0].email;
                let token = jwt.sign({userEmail}, SECRET_KEY)
                let foundStaff = foundUser[0]
                console.log(token)
                console.log(`the user ${foundStaff}`)
                return res.status(201).json({token, foundStaff})
        } else {
            throw new ExpressError(`Could not find user with email ${email} in system`)
        }

      
    }


    }
    catch(err) {res.status(400).json({message: err.message})}
});




    
    
    //Updating one
    router.patch('/:schoolID', getStaff, async (req, res) => {
       
    
        try{
            let editedStaff = req.body
            const updatedStaff = await staffModel.findOneAndUpdate({schoolID: req.params.schoolID}, editedStaff, {new: true})
            res.status(201).json(savedStaff)

        }


        catch(err) {res.status(400).json({message: err.message})}

    
    });


    
    //Delete one
    router.delete('/:schoolID', getStaff, async (req, res) => {
    
        try{
            await res.staff.remove()
            res.json({message: "Deleted Staff Member"})
        } 

        catch(err) {res.status(500).json({message: err.message})}
    

        
    });



    async function getStaff(req, res, next) {
        let staff;
 
        try{
            staff = await staffModel.find(req.params.schoolID);
            if(staff == null) {
                return res.status(404).json({message: "Cannot find Staff Member"})
            }
        }

        catch(err) {return res.status(500).json({message: err.message})}

        res.staff = staff
        next()
    };

    module.exports = router



