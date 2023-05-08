




class ExpressError extends Error {
    constructor(message, status) {
        super();
        this.message = message;
        this.status = status;
    }
}



//404 Not Found Error
class NotFoundError extends ExpressError {
    constructor(message = "Not Found, custom message") {
        super(message, 404);
    }
    
}


//401 Unauthorized Error

class UnauthorizedError extends ExpressError {
    constructor(message = "Unauthorized, custom message"){
        super(message, 401)
    }
}



class BadRequestError extends ExpressError {
    constructor(message = "Bad Request, custom message") {
        super(message, 400)
    }
}



class ForbiddenError extends ExpressError {
    constructor(message = "Forbidden Request, custom message") {
        super(message, 403)
    }
}



module.exports = {
    ExpressError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError
}