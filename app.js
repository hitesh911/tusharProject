const express = require("express")
const mongoose = require('mongoose')
const path = require("path")
const exphbs  = require('express-handlebars')
const cookieParser = require("cookie-parser")
const session = require("express-session")
const temporary_cred = require(path.join(__dirname, "/credentials/temporary_cred"))
const App = express()
const server = require("http").Server(App)
const io = require('socket.io')(server)
const socket = require(path.join(__dirname, "socket"))

socket(io)

// giving session argument to (connect-mongodb-session) method 
const mongoDbStore = require("connect-mongodb-session")(session)

const port = process.env.PORT || 3000
// DATABASE  
connection = require("./database/db")

// ADDING TEMPLATES ENGINE 
// coustom configrations for handlebar 
const hbs = exphbs.create({
	// some helper functions 
	helpers:{
		equal: (v1, v2) => v1 === v2,
		not_equal: (v1, v2) => v1 != v2,
		length_0(v1){
			if(v1.length == 0){
				return true
			} 
			else{
				return false
			}
		} 
	}
	,
	extname: ".hbs",
})
// adding engine to express 
App.engine('.hbs', hbs.engine)
App.set('view engine', '.hbs')
// MIDDLEWARES 
// thirld party middlewares 
// this for saving session in database
const sessionStore = new mongoDbStore({
	uri: temporary_cred.DATABASE_URI,
	collection:"Session"
})
// session error handler 
sessionStore.on("error",(err)=>{
	console.log(`this is session error : ${err}`)
})
App.use(cookieParser("secretstringishere"))
 //calculating maxage for one week
App.use(session({secret: "thisisalsosecretstring",store : sessionStore,resave : true,saveUninitialized:true,cookie:{maxAge: 1000*60*60*24*7}})) 
App.use(express.urlencoded({extended:false}))
App.use(express.json())
App.use(express.static(path.join(__dirname , "/public")) )
// couston middle ware
// this is for notification 
App.use((req,res,next)=>{
	res.locals.message =  req.session.message
	delete req.session.message
	next()
})
// middleware for routs  Note it must be in last 
App.use("/" , require(path.join(__dirname ,"routes/myrouts.js")))


server.listen(port , ()=>{
	console.log(`App listening on :${port}`)
})

