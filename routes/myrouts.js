const express = require("express")
const path = require("path")
const uikit = require("../public/js/uikit")
const {randomBytes} = require("crypto")
const {
	google
} = require('googleapis')
const googleApiCred = require(path.join(__dirname, "../credentials/googleApiLocalCred"))
const temporary_cred = require(path.join(__dirname, "../credentials/temporary_cred"))


// DATABASE MODAL IMPORTS 
const {Student,Staff} = require("../database/models/register")

// credentials imports 
const TEMPORARY_OTP = temporary_cred.TEMPORARY_OTP
const YOUR_CLIENT_ID = googleApiCred.web.client_id
const YOUR_CLIENT_SECRET = googleApiCred.web.client_secret
const YOUR_REDIRECT_URL = googleApiCred.web.redirect_uris
const GOOGLE_API_SCOPE = "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email"
// making object for oauth2 
const oauth2ClientLogin = new google.auth.OAuth2(
	YOUR_CLIENT_ID,
	YOUR_CLIENT_SECRET,
	YOUR_REDIRECT_URL[0]
)



// main 
const router = express.Router()
// login get for students 
router.get("/", async (req, res) => {
	try {
		if(req.session.csrf=== undefined){
			req.session.csrf= randomBytes(100).toString("base64")
		}else{
			//do nothing
		}
		// is user credentails exists in cookie so login  
		if (req.session.studentInfo != null && req.session.studentInfo != undefined) {
			return res.render("login", {
				layout: "main",
				title: "login",
				context: req.session.studentInfo,
				email:req.session.email,
				email_picture: req.session.email_picture,
				type:"student",
				csrf: req.session.csrf
			})

		} else {
			// initlizing login session
			req.session.studentInfo = {}
			// if no session is saved so login mannuly 
			return res.render("login", {
				layout: "main",
				title: "login",
				type:"student",
				email:req.session.email,
				email_picture: req.session.email_picture,
				csrf: req.session.csrf
			})
		}
	} catch(e) {
		req.session.message = {
			heading: "Error",
			msg: "Something wrong happened contact JUFFLER",
			timeout: "5000",
			color: "#ff0000",
			icon: "warning"
		}
		return redirect("/")
		console.log(e);
	}
	
})
// login get for staff 
router.get("/login-staff",(req,res)=>{
	try {
		if(req.session.csrf=== undefined){
			req.session.csrf= randomBytes(100).toString("base64")
		}else{
			//do nothing
		}
		if (req.session.staffInfo != null && req.session.staffInfo != undefined) {
			return res.render('login',{
				layout:"main",
				title:"login staff",
				type:"staff",
				context: req.session.staffInfo,
				csrf: req.session.csrf,
				email: req.session.email,
				email_picture:req.session.email_picture
			})
		}else{
			// initlizing login session
			req.session.staffInfo = {}
			return res.render('login',{
				layout:"main",
				title:"login staff",
				type:"staff",
				csrf: req.session.csrf,
				email: req.session.email,
				email_picture:req.session.email_picture
			})

		}
	} catch(e) {
		req.session.message = {
			heading: "Error",
			msg: "Something wrong happened contact JUFFLER",
			timeout: "5000",
			color: "#ff0000",
			icon: "warning"
		}
		return res.redirect("/login-staff")
		console.log(e);
	}
})
// handling both login staff and login student post requests 
router.post("/login", async (req, res) => {
	try {
		if(req.body.csrf === req.session.csrf){
			if(req.session.email){
				if(req.body.identifierId){
					studentId = await Student.findOne({student_id:req.body.identifierId}).exec()
					universityRoll = await Student.findOne({university_roll_no:req.body.identifierId}).exec()
					if(studentId != null){
						req.session.studentInfo["student_id"] = req.body.identifierId
						return res.redirect("/student-dashboard")
					}else if(universityRoll != null){
						req.session.studentInfo['university_roll_no'] = req.body.identifierId
						return res.redirect("/student-dashboard")
					}else{
						req.session.message = {
							heading: "Error",
							msg: "No maching StudentID or University Roll no.",
							timeout: "5000",
							color: "#ff0000",
							icon: "warning"
						}
						return res.redirect("/")
					}
				}else if(req.body.profName){
					profName = await Staff.findOne({profName:req.body.profName}).exec()
					if(profName != null){
						req.session.staffInfo["profName"] = req.body.profName
						return res.redirect("/staff-dashboard")
					}else{
						req.session.message = {
							heading: "Error",
							msg: "proffesor name no found in staff list",
							timeout: "5000",
							color: "#ff0000",
							icon: "warning"
						}
						return res.redirect("/login-staff")
					}

				}else{
					req.session.message = {
							heading: "Error",
							msg: "Fields are not filled properly",
							timeout: "5000",
							color: "#ff0000",
							icon: "warning"
						}
					return res.redirect('/')
				}

			}else{
				req.session.message = {
					heading: "Error",
					msg: "Please choose an email address",
					timeout: "5000",
					color: "#ff0000",
					icon: "warning"
				}
				return res.redirect(req.get('referer'))
			}
		}else{
			req.session.message = {
					heading: "Error",
					msg: "Csrf verification failed",
					timeout: "5000",
					color: "#ff0000",
					icon: "warning"
				}
				return res.redirect("/")
		}
	} catch(e) {
		console.log(e)
		// statements
		req.session.message = {
			heading: "Error",
			msg: "Login failed, some fields are missing",
			timeout: "5000",
			color: "#ff0000",
			icon: "warning"
		}
		res.redirect("/")
	}

})
router.get("/staff-dashboard",async (req,res)=>{
	try {
		if (req.session.staffInfo != null && req.session.staffInfo != undefined) {
			if(req.session.staffInfo.profName){
				staff = await Staff.findOne({profName:req.session.staffInfo.profName}).exec()
				if(staff.email === ""){
					staff.email = req.session.email
					staff.save()
				}else if(staff.email != req.session.email){
					await delete req.session.studentInfo
					req.session.message = {
						heading: "Error",
						msg: "Provided email does not belongs to proffesor. Contact JUFFLER for any query",
						timeout: "9000",
						color: "#ff0000",
						icon: "warning"
					}
					return res.redirect("/login-staff")
				}else{
					//pass	
				}
				return res.render('staffDashboard',
					{
						layout:'dashboard',
						title:"staff Dashboard",
						staffDetails:{
							doc:staff.toObject(),
							picture: req.session.email_picture
						}
					})
			}else{
				await delete req.session.studentInfo
				req.session.message = {
						heading: "Error",
						msg: "Session has been expired. Login again",
						timeout: "9000",
						color: "#ff0000",
						icon: "warning"
					}
			return res.redirect("/")
			}
		}else{
			await delete req.session.studentInfo
			req.session.message = {
					heading: "Error",
					msg: "Session has been expired. Login again",
					timeout: "9000",
					color: "#ff0000",
					icon: "warning"
				}
			return res.redirect("/")
		}
	} catch(e) {
			await delete req.session.studentInfo
			req.session.message = {
					heading: "Error",
					msg: "Server error contact to JUFFLER",
					timeout: "9000",
					color: "#ff0000",
					icon: "warning"
				}
			return res.redirect("/")
			console.log(e);
	}
})
router.get('/student-dashboard',async (req,res)=>{
	try {
		// checking studentInfo contains any legal authentication parameter 
		if (req.session.studentInfo != null && req.session.studentInfo != undefined) {
			// initlizing student 
			var student = {}
			if (req.session.studentInfo.student_id) {
				student = await Student.findOne({student_id:req.session.studentInfo.student_id}).exec()
				if(student.email === ""){
					student.email = req.session.email
					await student.save()
				}else if(student.email != req.session.email){
					await delete req.session.studentInfo
					req.session.message = {
						heading: "Error",
						msg: "Provided email does not belongs to Student. Contact your proffesor",
						timeout: "9000",
						color: "#ff0000",
						icon: "warning"
					}
					return res.redirect("/")
				}else{
					// pass
				}

			} else if (req.session.studentInfo.university_roll_no) {
				student = await Student.findOne({university_roll_no:req.session.studentInfo.university_roll_no}).exec()
				if(student.email === ""){
					student.email = req.session.email
					await student.save()
				}else if(student.email != req.session.email){
					await delete req.session.studentInfo
					req.session.message = {
						heading: "Error",
						msg: "Provided email does not belongs to Student. Contact your proffesor",
						timeout: "9000",
						color: "#ff0000",
						icon: "warning"
					}
					return res.redirect("/")
				}else{
					//pass
				}
			} else {
				await delete req.session.studentInfo
				req.session.message = {
					heading: "Error",
					msg: "You must have to provide existing StudentID or University Roll no with verified email",
					timeout: "9000",
					color: "#ff0000",
					icon: "warning"
				}
				return res.redirect("/")
			}
			return res.render('studentDashboard',
			{
				layout:'dashboard',
				title:"Student Dashboard",
				studentDetails:{
					doc:student.toObject(),
					picture: req.session.email_picture
				}
			})
		}else{
			await delete req.session.studentInfo
			req.session.message = {
					heading: "Error",
					msg: "Session has been expired. Login again",
					timeout: "9000",
					color: "#ff0000",
					icon: "warning"
				}
			return res.redirect("/")
		}
	} catch(e) {
		// statements
		console.log(e);
		req.session.message = {
					heading: "Error",
					msg: "Some error happened contact JUFFLER",
					timeout: "9000",
					color: "#ff0000",
					icon: "warning"
				}
		return res.redirect("/")
	}
})


//google login system
router.get("/get-email", (req, res) => {
	const url = oauth2ClientLogin.generateAuthUrl({
		access_type: 'offline',
		scope: GOOGLE_API_SCOPE
	})
	res.redirect(url)

})
router.get("/google-login-callback", async (req, res) => {
	const code = req.query.code
	if (code) {
		const {
			tokens
		} = await oauth2ClientLogin.getToken(code)
		oauth2ClientLogin.setCredentials(tokens);
		// this google oauth2 function returns value depends upon your provided scopes 
		const userInfoScope = google.oauth2({
			auth: oauth2ClientLogin,
			version: "v2"
		})
		userInfoScope.userinfo.get((err, apiresponse) => {
			if (err) {
				req.session.message = {
					heading: "Error",
					msg: "Login failed",
					timeout: "5000",
					color: "#ff0000",
					icon: "warning"
				}
				console.log(`JUFFLER googleAPI error : ${err}`)
				return res.redirect("/")
			} else {
				// if every thing goes right so making successfull login 
				const userInformation = apiresponse.data
				if(userInformation.verified_email){
					// making session to store email 
					req.session.email = userInformation.email
					req.session.email_picture = userInformation.picture
				}else{
					req.session.message = {
						heading: "Error",
						msg: "Login failed Your email is not verified",
						timeout: "5000",
						color: "#ff0000",
						icon: "warning"
					}
				}
				return res.redirect("/")
			}
		})

	} else {
		req.session.message = {
			heading: "Error",
			msg: "Login failed",
			timeout: "5000",
			color: "#ff0000",
			icon: "warning"
		}
		res.redirect("/")
	}

})
// get interface to list accout creation options 
router.get("/create-account", (req, res) => {
	if(req.session.csrf=== undefined){
		req.session.csrf = randomBytes(100).toString("base64")
	}else{
		//do nothing
	}
	context = {
		"csrf":req.session.csrf
	}
	res.render("register", {
		layout: "main",
		title: "CreateNewAccount",
		context:context

	})
})
// creating staff
router.post("/create-staff",async (req,res)=>{
	try {
		const staffData = req.body
		var staffExistance = await Staff.findOne({profName:staffData.profName}).exec()
		if(staffExistance == null){
			const newStaff = new Staff({
				profName:staffData.profName,
				email:staffData.email
			})
			await newStaff.save()
			req.session.message = {
				heading: "Succed",
				msg: "Account created successfully",
				timeout: "5000",
				color: "#00ff00",
				icon: "happy"
			}
			return res.redirect("/create-account")
		}else{
			req.session.message = {
				heading: "Error",
				msg: `proffesor already exists with name ${staffExistance.profName}`,
				timeout: "5000",
				color: "#ff0000",
				icon: "warning"
			}
			return res.redirect("/create-account")
		}
	} catch(e) {
		req.session.message = {
			heading: "Error",
			msg: "Server error contact JUFFLER",
			timeout: "5000",
			color: "#ff0000",
			icon: "warning"
		}
		res.redirect("/login-staff")
		console.log(e);
	}
})
// creating students 
router.post("/create-student", async (req, res) => {
		try {
			const studentInfo = req.body
			var studentExistance = null
			if(studentInfo.student_id){
				studentExistance = await Student.findOne({"student_id":studentInfo.student_id}).exec()
			}else if (studentInfo.university_roll_no){
				studentExistance = await Student.findOne({"university_roll_no":studentInfo.university_roll_no}).exec()
			}else{
				studentExistance = null
			}
			// if user not exists so create new one 
			if (studentExistance == null) {
				const newStudent = new Student({
					registration_status: studentInfo.registration_status,
					student_id: studentInfo.student_id,
					email: studentInfo.email,
					university_roll_no: studentInfo.university_roll_no,
					class_roll_no:studentInfo.class_roll_no,
					student_name:studentInfo.student_name,
					father_name: studentInfo.father_name,
					section: studentInfo.section,
					year_sem: studentInfo.year_sem,
					branch: studentInfo.branch
				})
				await newStudent.save()
				req.session.message = {
					heading: "Succed",
					msg: "Account created successfully",
					timeout: "5000",
					color: "#00ff00",
					icon: "happy"
				}
				return res.redirect("/create-account")
			} else {
				req.session.message = {
					heading: "Error",
					msg: `User already exists with student id ${studentExistance.student_id}`,
					timeout: "5000",
					color: "#ff0000",
					icon: "warning"
				}
				return res.redirect("/create-account")

			}

		} catch (e) {
			console.log(`JUFFLER error occure while creating user account ${e}`)
			req.session.message = {
				heading: "Error",
				msg: "Can't communicate with server. Contact JUFFLER",
				timeout: "5000",
				color: "#ff0000",
				icon: "warning"
			}
			return res.redirect("/create-account")
		}
})
router.get("/logout", async (req, res) => {
	try {
		const status = await delete req.session.studentInfo
		req.session.message = {
			heading: "Succed",
			msg: "Logged out successfully",
			timeout: "5000",
			color: "#00ff00",
			icon: "happy"
		}
		return res.redirect("/")
	} catch (e) {
		req.session.message = {
			heading: "Error",
			msg: "Something wrong happened",
			timeout: "5000",
			color: "#ff0000",
			icon: "warning"
		}
		return res.redirect(req.get("referer"))

	}
})
router.get("/user-settings", (req, res) => {
	res.send("user settings are not avalable right now ")
})


// owner privlaged functions 
router.post("/create-user", async (req, res) => {
		try {
			// checking if user alrady exists 
			// const userExistance = await checkExistance({name: "whatsapp_no",value: req.body.whatsapp_no})
			// init vars 
			const userInformation = req.body
			var userExistance = {status: false , data: null}
			let ifExistsSoWith 
			if(userInformation.whatsapp_no != ""){
				userExistance = await checkExistance({name: "whatsapp_no",value: req.body.whatsapp_no})
				ifExistsSoWith = "whatsapp_no"
			}else{
				// pass
			}
			if(!userExistance.status){
				if(userInformation.email != ""){
					userExistance = await checkExistance({name: "email",value: req.body.email})
					ifExistsSoWith = "email"
				}else{
					// pass
				}
			}else{
				// pass 
			}
			// if user not exists so create new one 
			if (!userExistance.status) {
				const registerUser = new Register({
					fname: req.body.fname,
					profile_name: req.body.profile_name,
					position: req.body.position,
					email: req.body.email,
					telegram_id: req.body.telegram_id,
					whatsapp_no: req.body.whatsapp_no,
					alternative_whatsapp_no: req.body.alternative_whatsapp_no,
					paytm_no: req.body.paytm_no,
					google_pay_no: req.body.google_pay_no,
					phone_pay_no: req.body.phone_pay_no,
					upi_id: req.body.upi_id,
					alternate_upi_id: req.body.alternate_upi_id,
				})
				const registered = await registerUser.save()
				req.session.message = {
					heading: "Succed",
					msg: "Account created successfully",
					timeout: "5000",
					color: "#00ff00",
					icon: "happy"
				}
				return res.redirect("..")
			} else {
				req.session.message = {
					heading: "Error",
					msg: `User already exists with this ${ifExistsSoWith}.`,
					timeout: "5000",
					color: "#ff0000",
					icon: "warning"
				}
				return res.redirect("..")

			}

		} catch (e) {
			console.log(`JUFFLER error occure while creating user account ${e}`)
			req.session.message = {
				heading: "Error",
				msg: "Can't communicate with server",
				timeout: "5000",
				color: "#ff0000",
				icon: "warning"
			}
			return res.redirect("/create-account")
		}
		return res.redirect("/create-account")
})

module.exports = router
