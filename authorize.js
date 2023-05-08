const jwt = require("jsonwebtoken");


//Middlware: Authenticate User

function authenticateJWT(req,res, next) {
    try{
        const authHeader = req.headers && req.headers.authorization;
        if (authHeader) {
            const token = authHeader;
            const payload = jwt.verify(token, SECRET_KEY);
            res.locals.user = payload;
        }
        return next()
    }
    catch(err) {
        return next(err)
    } 
}




//Middleware to use to ensure they're logged in

function ensureLoggedIn(req, res, next) {
    try{
        if(!res.locals.user) throw new UnauthorizedError();
        return next()
    }
    catch(err) {
        return next(err)
    }

};




//Middleware to ensure correct user


function ensureCorrectUser(req, res, next) {
    try{
        const user = res.locals.user;
        console.log("Hey: ", user)
        if((!user) && (user.id != req.params.id)) {
            throw new UnauthorizedError();
        }
        return next();
    }

    catch(err) {
        return next(err);
    }
};

module.exports = {ensureCorrectUser, ensureLoggedIn, authenticateJWT}