const mongoose = require("mongoose")
//------------ creating schema -----------------
const userSchema = new mongoose.Schema({
	fname:{
		type: String,
		required:true
	},profile_name:{
		type: String,
		required:true
	},position:{
		type: String,
		required:true
	},email:{
		type: String,
		required:false,
		default:""
	},telegram_id:{
		type: String,
		required:false,
		default:""
	},whatsapp_no:{
		type: String,
		required:false
	},alternate_whatsapp_no:{
		type: String,
		required:false,
		default:""
	},paytm_no:{
		type: String,
		required:false,
		default:""
	},google_pay_no:{
		type: String,
		required:false,
		default:""
	},phone_pay_no:{
		type: String,
		required:false,
		default:""
	},upi_id:{
		type: String,
		required:false,
		default:""
	},alternate_upi_id:{
		type: String,
		required:false,
		default:""
	}
})


// ----------------now creating modal ------------------
const Register = mongoose.model("User",userSchema )
module.exports = Register