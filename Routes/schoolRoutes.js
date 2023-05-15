
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
        let {schoolName, schoolCode, adminTitle, adminName, password} = req.body;

        let foundSchool = await schoolModel.find({schoolCode: schoolCode});
        
        console.log(foundSchool)
        
        if(foundSchool.length > 0) {
            throw new ExpressError(`A school using this school code ${schoolCode} already exists `)
        }

         else

       {
        //Hash password
        const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
        //Create new school
        const createdSchool = await schoolModel.create({schoolName:schoolName, schoolCode:schoolCode, adminTitle: adminTitle, adminName: adminName, password: hashedPassword})

        //Save to db
        const savedSchool = await createdSchool.save()

        console.log(`The savedSchool is  ${savedSchool}`)

        const token = jwt.sign(savedSchool.schoolCode, SECRET_KEY);

        res.status(201).json({savedSchool, token})}
        



    }

catch(err) {res.status(400).json({message: err.message})}



});









//LOGIN SCHOOL/ADMIN

router.post('/login', async (req, res) => {
    try {
        let { adminName, password, schoolCode } = req.body;

        // Find by schoolCode and adminName
        let foundSchool = await schoolModel.findOne({ schoolCode: schoolCode, adminName: adminName });
        if (!foundSchool) {
            throw new Error(`Could not find school with code ${schoolCode} or admin with name ${adminName}`);
        }

        // Check if password is correct
        let isValid = await bcrypt.compare(password, foundSchool.password);

        if (!isValid) {
            throw new Error("Invalid username/password/schoolCode");
        }

        // If password is correct, generate token and send response
        delete foundSchool.password;
        let token = jwt.sign({ schoolCode }, SECRET_KEY);
        console.log(token);
        console.log(foundSchool);
        return res.json({ token, foundSchool });
    } catch(err) {
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



