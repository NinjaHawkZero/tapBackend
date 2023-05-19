const express = require('express');
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require('../config');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {ExpressError} = require("../expressError")
const { schoolModel } = require('../SchoolModels');
const router = express.Router()
const { staffModel} = require("../StaffModel")
const { classModel} = require("../ClassModel")




//REGISTER STAFF MEMBER, IF TEACHER, GENERATES EIGHT CLASSES FOR TEACHER
// router.post('/register', async (req,res) => {
//     try{
//         let {schoolCode, name, title, password, email} = req.body;
//         let foundSchool = await schoolModel.find({schoolCode: schoolCode});
//         let foundStaff = await staffModel.find({email: email});


        

//         if(foundSchool.length > 0) {
//             if(foundStaff.length > 0) {
//                 console.log(foundStaff[0])
//                 throw new Error(`This email is already in use`);
//             }
//             else {
//                 let schoolID = foundSchool[0]._id;
//                 const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
//                 let newStaffMember = await staffModel.create({schoolID: schoolID, schoolCode: schoolCode, name: name, password: hashedPassword, title: title, email: email });

//                 if(newStaffMember.title.toLowerCase() === "teacher") {
//                     try {
//                         let classes = ["firstHour", "secondHour", "thirdHour", "fourthHour", "fifthHour", "sixthHour", "seventhHour", "eighthHour"];
//                         for(let i=0; i<8; i++) {
//                             let newClass = await classModel.create({staffID: newStaffMember._id, schoolID: newStaffMember.schoolID, className: `Class ${i+1}`, hour: classes[i]});
//                             await newClass.save();
//                         }
//                     } catch(err) {
//                         res.status(400).json({message: "Could not make classes"});
//                     }
//                 }

//                 const savedStaffMember = await newStaffMember.save();
//                 console.log(savedStaffMember)
//                 const token = jwt.sign(savedStaffMember._id, SECRET_KEY);
//                 res.status(201).json({savedStaffMember, token});
//             }
//         }
//         else {
//             throw new Error(`Could not find school with SchoolCode ${schoolCode}`);
//         }
//     }
//     catch(err) {
//         res.status(400).json({message: err.message});
//     }
// });




router.post('/register', async (req,res) => {
    try{
        let {schoolCode, name, title, password, email, googleId} = req.body;
        let storedGoogleID = googleId;
        let storedEmail = email;
        let storedPassword = password;




        let foundSchool = await schoolModel.find({schoolCode: schoolCode});

        if(foundSchool.length > 0) {




           ///// *******************************************************************
            //If GoogleID Exists
            if (storedGoogleID != null || storedGoogleID != undefined) {

                try{

                let foundStaff = await staffModel.find({googleId: storedGoogleID})



                if(foundStaff.length > 0) {
                    throw new ExpressError(`GoogleID already in use by another account`)
                } else {
                    //Create User
                    let schoolID = foundSchool[0]._id;
                    let newStaffMember = await staffModel.create({schoolID: schoolID, schoolCode: schoolCode, title: title, name: name, googleId: storedGoogleID});


                if(newStaffMember.title.toLowerCase() === "teacher") {
                    try {
                        let classes = ["firstHour", "secondHour", "thirdHour", "fourthHour", "fifthHour", "sixthHour", "seventhHour", "eighthHour"];
                        for(let i=0; i<8; i++) {
                            let newClass = await classModel.create({staffID: newStaffMember._id, schoolID: newStaffMember.schoolID, className: `Class ${i+1}`, hour: classes[i]});
                        }
                    } catch(err) {
                        res.status(400).json({message: "Could not make classes"});
                    }
                }
                    


                const token = jwt.sign({ _id: newStaffMember._id }, SECRET_KEY);
                res.status(201).json({staffMember: newStaffMember, token});

                }


                }

                catch(err) {res.status(404).json({message: "Could not register user with GoogleId"})}


            }

            //******************************************************************************************* */





            if ((storedEmail != null  && storedPassword != null) || (storedEmail != undefined && storedPassword != undefined  ))

            {



                try{


                    let foundStaff = await staffModel.find({email: storedEmail});

                    if(foundStaff.length > 0) {
                        throw new ExpressError(`Staffmember with email ${storedEmail} already in use`)
                    } else {


                        let schoolID = foundSchool[0]._id;
                        const hashedPassword = await bcrypt.hash(storedPassword, BCRYPT_WORK_FACTOR);
                        let newStaffMember = await staffModel.create({schoolID: schoolID, schoolCode: schoolCode, name: name, password: hashedPassword, title: title, email: storedEmail });
        
                        if(newStaffMember.title.toLowerCase() === "teacher") {
                            try {
                                let classes = ["firstHour", "secondHour", "thirdHour", "fourthHour", "fifthHour", "sixthHour", "seventhHour", "eighthHour"];
                                for(let i=0; i<8; i++) {
                                    let newClass = await classModel.create({staffID: newStaffMember._id, schoolID: newStaffMember.schoolID, className: `Class ${i+1}`, hour: classes[i]});
                                }
                            } catch(err) {
                                res.status(400).json({message: "Could not make classes"});
                            }
                        }
                        
                        const token = jwt.sign({ _id: newStaffMember._id }, SECRET_KEY);
                        res.status(201).json({staffMember: newStaffMember, token});
                    

                    }





                }        
                
                catch(err)
                 {
                    res.status(404).json({message: err.message})
                }
               

            }





        } else { throw new ExpressError(`No School Found with schoolCode ${schoolCode}`)}




    }
    catch(err) {
        res.status(400).json({message: err.message});
    }
});




     





//LOGIN STAFF
router.post('/login', async (req, res) => {
    try {
        let { password, email, googleId} = req.body;
        let storedPassword = password;
        let storedEmail = email;
        let storedGoogleID = googleId




        if (storedGoogleID != null || storedGoogleID != undefined)  {

            try{
                //try to find in db
                let foundGoogleStaff = await schoolModel.find({googleId: storedGoogleID});

                if(foundGoogleStaff.length > 0) {


                    if(foundGoogleStaff[0].googleId === storedGoogleID) {
                        let id = foundGoogleStaff[0].googleId;

                        let token = jwt.sign({id}, SECRET_KEY);
                        console.log(`this is the googletoken ${token}`)
                      console.log('this is the google user')
                      res.status(200).json({token, foundGoogleStaff})

                    } else {throw new ExpressError("GoogleID doesn't match googleID in DB")}
                }



            }

            catch(err)
            {res.status(404).json({message: `Can't find student for GoogleID ${storedGoogleID}`})}

        } else if ((storedEmail != null  && storedPassword != null) || (storedEmail != undefined && storedPassword != undefined  ) )


        {



        let foundUser = await staffModel.find({email: email});

        if(foundUser.length > 0) {
            let isValid = await bcrypt.compare(password, foundUser[0].password)

            if(isValid) {
                delete foundUser[0].password;
                let userEmail = foundUser[0].email;
                let token = jwt.sign({userEmail}, SECRET_KEY)
                let foundStaff = foundUser[0]
                console.log(token)
                console.log(`the user ${foundStaff}`)
                return res.status(201).json({token, foundStaff})
            } else {
                throw new Error('Invalid password');
            }
        } else {
            throw new Error(`Could not find user with email ${email} in system`);
        }







        } else {
            throw new ExpressError("Could not match account info with user in DB")
        }


 












    }
    catch(err) {
        res.status(400).json({message: err.message});
    }
});







//GETTING ALL STAFF MEMBERS FOR A SCHOOL
router.get('/:schoolID', async (req, res) => {

    try{
        let schoolID = req.params.schoolID
        let foundStaff = await staffModel.find({schoolID: schoolID})
        res.status(201).json(foundStaff)
    }

    

    catch(err) {
        res.status(400).json({message: err.message})
    
    }});
    
    










//GETTING A STAFF MEMBER FOR A SCHOOL
    router.get('/:_id',  async (req, res) => {

        try{
            let staffMemberArr = await staffModel.find({_id: req.params._id})
            let member = staffMemberArr[0]
            res.status(201).json(member)
        }
catch(err) {res.status(400).json({message: err.message})}

  
    });
    
    











//GETTING ALL TEACHERS FOR A SCHOOL
    router.get('/teachers/:schoolID', async (req, res) => {
        try{
            let foundStaff = await staffModel.find({schoolID: req.params.schoolID})
            let teacherArr = [];
            foundStaff.forEach(function (staffMember) {
                if(staffMember.title === "Teacher" || staffMember.title === 'teacher') {
                    teacherArr.push(staffMember)
                }
            })

            
            res.status(201).json(teacherArr)

        }
        catch(err) {
            res.status(400).json({message: err.message})
        }
        

    });













//GETTING ALL COUNSELORS FOR A SCHOOL

    router.get('/counselors/:schoolID', async (req, res) => {
        try{
            let foundStaff = await staffModel.find({schoolID: req.params.schoolID});
            let counselorArr = [];
            foundStaff.forEach( function(staffMember) {
                if(staffMember.title === 'Counselor' || staffMember.title === 'counselor') {
                    counselorArr.push(staffMember)
                }
            });
            
            res.status(201).json(counselorArr)
        }

        catch(err) {
            res.status(400).json({message: err.message})
        }
    } );







              



    
    
//UPDATING ONE
    router.patch('/:schoolID', getStaff, async (req, res) => {
       
    
        try{
            let editedStaff = req.body
            const updatedStaff = await staffModel.findOneAndUpdate({schoolID: req.params.schoolID}, editedStaff, {new: true})
            res.status(201).json(savedStaff)

        }


        catch(err) {res.status(400).json({message: err.message})}

    
    });


    
//DELETE ONE
    router.delete('/:schoolID', getStaff, async (req, res) => {
    
        try{
            await res.staff.remove()
            res.json({message: "Deleted Staff Member"})
        } 

        catch(err) {res.status(500).json({message: err.message})}
    

        
    });




//STAFF MIDDLEWARE
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



