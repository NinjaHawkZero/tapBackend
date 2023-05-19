
const { reset } = require('colors');
const express = require('express')
const bcrypt = require("bcrypt");
const router = express.Router()
const {ExpressError} = require("../expressError")
const {db} = require('../SchoolModels')
const { schoolModel} = require('../SchoolModels')
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config")
const jwt = require("jsonwebtoken");
//const {ensureLoggedIn, authenticateJWT, ensureCorrectUser} = require("../authorize")






//REGISTER SCHOOL/ADMIN
router.post('/register', async (req, res) => {

    try {
        
        //Grab all properties from the request
        let {schoolName, schoolCode, adminTitle, adminName, password, googleId} = req.body;
        let storedGoogleID = googleId;
        let storedEmail = email;
        let storedPassword = password;


        //Try to find school for user
        let foundSchool = await schoolModel.find({schoolCode: schoolCode});
        
        console.log(foundSchool)
        
        if(foundSchool.length > 0) {
            throw new ExpressError(`A school using this school code ${schoolCode} already exists `)
        }

         else if (storedGoogleID != null || storedGoogleID != undefined)

       {
        
        
        //Create new school
        const createdSchool = await schoolModel.create({schoolName:schoolName, schoolCode:schoolCode, adminTitle: adminTitle, adminName: adminName, googleId: storedGoogleID})

        //Save to db
        const savedSchool = await createdSchool.save()

        console.log(`The savedSchool is  ${savedSchool}`)

        const token = jwt.sign(savedSchool.googleId, SECRET_KEY);

        res.status(201).json({savedSchool, token})
    }



        else if ((storedEmail != null  && storedPassword != null) || (storedEmail != undefined && storedPassword != undefined  )) {


            const hashedPassword = await bcrypt.hash(storedPassword, BCRYPT_WORK_FACTOR);
            //Create new school
            const createdSchool = await schoolModel.create({schoolName:schoolName, schoolCode:schoolCode, adminTitle: adminTitle, adminName: adminName, password: hashedPassword})
    
            //Save to db
            const savedSchool = await createdSchool.save()
    
            console.log(`The savedSchool is  ${savedSchool}`)
    
            const token = jwt.sign(savedSchool.schoolCode, SECRET_KEY);
    
            res.status(201).json({savedSchool, token})




        } else {

            throw new ExpressError('Could not register School')
        }
        



    }

catch(err) {res.status(400).json({message: err.message})}



});









//LOGIN SCHOOL/ADMIN

router.post('/login', async (req, res) => {
    try {
        let { adminName, password, schoolCode, googleId } = req.body;
        let storedPassword = password;
        let storedAdminName = adminName;
        let storedGoogleID = googleId;



        if (storedGoogleID != null || storedGoogleID != undefined)   {

            try {
                //try to find in db
                let foundGoogleAdmin = await schoolModel.find({googleId: storedGoogleID});

                if(foundGoogleAdmin.length > 0) {


                    if(foundGoogleAdmin[0].googleId === storedGoogleID) {
                        let id = foundGoogleAdmin[0].googleId;

                        let token = jwt.sign({id}, SECRET_KEY);
                        console.log(`this is the googletoken ${token}`)
                      console.log('this is the google user')
                      res.status(200).json({token, foundGoogleAdmin})

                    } else {throw new ExpressError("GoogleID doesn't match googleID in DB")}
                }




            }

            catch(err)
            {res.status(404).json({message: `Can't find student for GoogleID ${storedGoogleID}`})}




        } else if(

            (storedAdminName != null  && storedPassword != null) || (storedAdminName != undefined && storedPassword != undefined  )

        ) {

            try{

             // Find by schoolCode and adminName
            let foundSchool = await schoolModel.findOne({ schoolCode: schoolCode, adminName: adminName });

            //If school exists
            if(foundSchool != null && foundSchool != undefined) {

                // Check if password is correct
            let isValid = await bcrypt.compare(password, foundSchool.password);

            if (!isValid) {
                throw new ExpressError("Invalid password");
            }

            delete foundSchool.password;
            let token = jwt.sign({ schoolCode }, SECRET_KEY);
            console.log(token);
            console.log(foundSchool);
            return res.json({ token, foundSchool });
            }

            }

            catch(err)
            {res.status(404).json({message: `Could not find school for code ${schoolCode} and name ${adminName}`})}



        } else {
            throw new ExpressError("Could not match Admin/School with name and password")
        }

        

    } catch
    (err) 
    {
        res.status(400).json({ message: err.message });
    }
});










//GETTING ALL SCHOOLS
router.get('/',  async (req, res) => {

 try{

let foundSchools = await schoolModel.find()
res.status(201).json(foundSchools)
}
catch(err)
{
    res.status(400).json({message: err.message})
}

});




//GETTING ONE SCHOOL
router.get('/:schoolCode', async (req, res) => {
    
    try{
        
        let foundSchool = await schoolModel.find({schoolCode: req.params.schoolCode})
        let school = foundSchool[0]
        res.status(201).json(school)
        
    }

catch(err) {res.status(400).json({message: err.message})}
});








    

 




//UPDATING ONE
router.patch('/:schoolCode', getSchool, async (req, res) => {
  

    try{
        let editedSchool = req.body
        const updatedSchool = await schoolModel.findOneAndUpdate({schoolCode: req.params.schoolCode}, editedSchool, {new: true})
        res.statusCode(201).json(updatedSchool)
    } catch(err) {res.status(400).json({message: err.message})}


});






//DELETE ONE
router.delete('/:schoolCode', getSchool, async (req, res) => {
try{
    await res.school.remove()
    res.json({message: "Deleted School"})
}
catch(err) {
    res.status(500).json({message: err.message})
}

});




//SCHOOL MIDDLEWARE
async function getSchool(req, res, next) {
    let school;
    try{

        school = await schoolModel.find({schoolCode: req.params.schoolCode} );
        if (school == null) {
            return res.status(404).json({message: "Cannot Find School"})
        }
    }
    catch(err) { return res.status(500).json({message: err.message})}

    res.school = school
    next()
};




module.exports = router



