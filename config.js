"use strict"


//Shared configuation for TapIn API

require("dotenv").config();
require("colors");


const SECRET_KEY = process.env.SECRET_KEY || "secret-dev";

const PORT = +process.env.PORT || 3001

//Use dev db, testing db, or via env variable, production db

function getDatabaseUri() {
    return (process.env.NODE_ENV === "test")

    ? "tapIn_test"
    : process.env.DATABASE_URL || "tapin2";
}


const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;


console.log("tapIn Config:" .green);
console.log("SECRET_KEY:" .yellow, SECRET_KEY);
console.log("PORT:" .yellow, PORT.toString());
console.log("BCRYPT_WORK_FACTOR:" .yellow, BCRYPT_WORK_FACTOR);
console.log("Database:" .yellow, getDatabaseUri());
console.log("---")




module.exports = {
    SECRET_KEY, PORT, BCRYPT_WORK_FACTOR, getDatabaseUri
};