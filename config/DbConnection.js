const mongoose = require("mongoose");
require("dotenv").config();
const mongodb = mongoose.connect(process.env.MONGODB_BASE_URL) //mongodb+srv://sunilmi7891:7HJMHO5iHWJVeAy7@cluster0.73wobrn.mongodb.net
    .then(() => {
        console.log("Sucessfully Connect with the CRM Database")
    }).catch(() => {
        console.log("Not Connect with the CRM Database")

    })
module.exports = mongodb