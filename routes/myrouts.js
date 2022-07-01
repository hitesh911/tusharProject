const express = require("express")
const path = require("path")
const uikit = require("../public/js/uikit")
const {
	google
} = require('googleapis')
const googleApiCred = require(path.join(__dirname, "../credentials/googleApiCred"))
const temporary_cred = require(path.join(__dirname, "../credentials/temporary_cred"))


// DATABASE MODAL IMPORTS 
const Register = require("../database/models/register")

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
const oauth2ClientRegister = new google.auth.OAuth2(
	YOUR_CLIENT_ID,
	YOUR_CLIENT_SECRET,
	YOUR_REDIRECT_URL[1]
)

// utility functions 
async function checkExistance(info) {
	let existance
	switch (info.name) {
		case "whatsapp_no":
			existance = await Register.findOne({
				"whatsapp_no": info.value
			}).exec();
			if (existance == null) {
				return {
					"status": false,
					"data": existance
				}
			} else {
				return {
					"status": true,
					"data": existance
				}
			}
			break;
		case "email":
			existance = await Register.findOne({
				"email": info.value
			}).exec();
			if (existance == null) {
				return {
					"status": false,
					"data": existance
				}
			} else {
				return {
					"status": true,
					"data": existance
				}
			}
			break;
		default:
			return {
				"status": false,
				"data": null
			}
			break;
	}
	// init existance 

}


// main 
const router = express.Router()

router.get("/", async (req, res) => {
	// is user credentails exists in cookie so login  
	if (req.session.loginInfo != null) {
		// initlizing userExistance
		var userExistance = {status: false,data: null}
		// checking logininfo contains any legal authentication parameter 
		if (req.session.loginInfo.whatsapp_no) {
			// sending otp logic 
			if (req.session.loginInfo.otp === TEMPORARY_OTP) {
				userExistance = await checkExistance({
					name: "whatsapp_no",
					value: req.session.loginInfo.whatsapp_no
				})
			} else {
				// if otp is incorrect so deleting wrong logininfo session 
				delete req.session.loginInfo
				req.session.message = {
					heading: "Error",
					msg: "Otp is incorrect check the number",
					timeout: "9000",
					color: "#ff0000",
					icon: "warning"
				}
				return res.redirect("/")
			}


		} else if (req.session.loginInfo.email) {
			userExistance = await checkExistance({
				name: "email",
				value: req.session.loginInfo.email
			})
		} else {
			userExistance.status = false
			userExistance.data = null
		}
		// make login successed 
		if (userExistance.status === true) {

			// main logic 
			if(req.session.message){
				res.locals.message = {
					heading: "Succed",
					msg: "Logged in successfully",
					timeout: "5000",
					color: "#00ff00",
					icon: "happy"
				}
			}
			dashboardContext = {
				"fname": userExistance.data.fname,
				"profile_name": userExistance.data.profile_name,
				"position": userExistance.data.position,
				"email": userExistance.data.email,
				"telegram_id": userExistance.data.telegram_id,
				"whatsapp_no": userExistance.data.whatsapp_no,
				"alternative_whatsapp_no": userExistance.data.alternative_whatsapp_no,
				"paytm_no": userExistance.data.paytm_no,
				"google_pay_no": userExistance.data.google_pay_no,
				"phone_pay_no": userExistance.data.phone_pay_no,
				"upi_id": userExistance.data.upi_id,
				"alternate_upi_id": userExistance.data.alternate_upi_id
			}
			if(userExistance.data.position === 'user'){
				res.render("userDashboard", {layout: "dashboard",title: "UserDashboard",dashboardContext})
			}else if(userExistance.data.position === 'manager'){
				res.render("managerDashboard", {layout: "dashboard",title: "ManagerDashboard",dashboardContext})

			}else if(userExistance.data.position === 'owner'){
				// getting all users from database 
				const allUsers = await Register.find({}).exec()
				// making users array seprated from database object 
				const userS = allUsers.map(item=> item.toObject())

				const specificInformation = {
					"users": userS
				}
				res.render("ownerDashboard", {layout: "dashboard",title: "OwnerDashboard",dashboardContext, specificInformation})
			}else{
				res.send("You are not a legal user")
			}
		} else {
			// if user doesn't exists but session exists so resetting session	
			await delete req.session.loginInfo
			req.session.message = {
				heading: "Error",
				msg: "User is no longer in existance",
				timeout: "9000",
				color: "#ff0000",
				icon: "warning"
			}
			return res.redirect("/")
		}

	} else {
		// if no session is saved so login mannuly 
		return res.render("login", {
			layout: "main",
			title: "login form"
		})
	}
})
router.post("/login", async (req, res) => {
	// user existance is verified so saving Credentials in cookie 
	req.session.loginInfo = {
		"whatsapp_no":  req.body.whatsapp_no,
		"otp":  req.body.otp
	}
	res.redirect("/")

})

router.get("/create-account", (req, res) => {
	res.render("register", {
		layout: "main",
		title: "CreateNewAccount"
	})
})
//google login system
router.get("/google-login", (req, res) => {
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
					// making session to store credentials 
					req.session.loginInfo = userInformation
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
router.get("/google-register-callback", async (req, res) => {
	const code = req.query.code
	if (code) {
		const {
			tokens
		} = await oauth2ClientRegister.getToken(code)
		oauth2ClientRegister.setCredentials(tokens);
		// this google oauth2 function returns value depends upon your provided scopes 
		const userInfoScope = google.oauth2({
			auth: oauth2ClientRegister,
			version: "v2"
		})
		userInfoScope.userinfo.get(async (err, apiresponse) => {
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
				// making session to store credentials 
				// req.session.loginInfo = apiresponse.data
				const userInformation = apiresponse.data
				if (userInformation.verified_email) {
					const userExistance = await checkExistance({name: "email",value: userInformation.email})
					console.log(userExistance)
					if (userExistance.status != true) {
						const registerUser = new Register({
							fname: userInformation.name,
							profile_name: userInformation.given_name,
							position: "user",
							email: userInformation.email,
							telegram_id: "",
							whatsapp_no: "",
							alternative_whatsapp_no: "",
							paytm_no: "",
							google_pay_no: "",
							phone_pay_no: "",
							upi_id: "",
							alternate_upi_id: "",
						})
						const registered = await registerUser.save()
						req.session.message = {
							heading: "Succed",
							msg: "Account created successfully",
							timeout: "5000",
							color: "#00ff00",
							icon: "happy"
						}
						// saving cookie session 
						req.session.loginInfo = {
							"email": userInformation.email
						}
						res.redirect("/")
					} else {
						req.session.message = {
							heading: "Error",
							msg: "User already exists with this email.",
							timeout: "5000",
							color: "#ff0000",
							icon: "warning"
						}
						res.redirect("/create-account")

					}
				} else {
					req.session.message = {
						heading: "Error",
						msg: "Your email is not verified. Try other",
						timeout: "5000",
						color: "#ff0000",
						icon: "warning"
					}
					res.redirect("/create-account")
				}
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
		return res.redirect("/")
	}

})

router.get("/google-register", (req, res) => {
	const url = oauth2ClientRegister.generateAuthUrl({
		access_type: 'offline',
		scope: GOOGLE_API_SCOPE
	})
	res.redirect(url)
})
// creating user in database 
router.post("/create-account", async (req, res) => {
	if(req.body.otp === TEMPORARY_OTP){
		try {
			// checking if Otp is right so do other stuff 
			const userExistance = await checkExistance({name: "whatsapp_no",value: req.body.whatsapp_no})
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
				// saving cookie session 
				req.session.loginInfo = {
					"whatsapp_no": req.body.whatsapp_no,
					"otp": req.body.otp
				}
				return res.redirect("/")
			} else {
				req.session.message = {
					heading: "Error",
					msg: "User already exists with this whatsapp no.",
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
				msg: "Can't communicate with server",
				timeout: "5000",
				color: "#ff0000",
				icon: "warning"
			}
			return res.redirect("/create-account")
		}
	}else{
		req.session.message = {
				heading: "Error",
				msg: "OTP is incorrect. Please check number",
				timeout: "5000",
				color: "#ff0000",
				icon: "warning"
			}
		return res.redirect("/create-account")

	}
})
router.get("/logout", async (req, res) => {
	try {
		const status = await delete req.session.loginInfo
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
		res.redirect("/")

	}
})
router.get("/user-settings", (req, res) => {
	res.send("user settings are not avalable right now ")
})





// owner provilaged functions 
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