const path = require("path")
const temporary_cred = require(path.join(__dirname, "../credentials/temporary_cred"))
const mongoose = require("mongoose")
const url = temporary_cred.DATABASE_URI

// declaration 
async function connection() {
  await mongoose.connect(url);
}

// main
connection().catch(err => console.log(`Hey JUFFLER this is database connectin error :${err}`))
module.exports = connection
