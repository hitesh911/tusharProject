const mongoose = require("mongoose")
//------------ creating schema -----------------
const studentSchema = new mongoose.Schema({
	registration_status:{
		type: Boolean,
		required:true
	},student_id:{
		type: Number,
		required:true
	},email:{
		type: String,
		required:false,
		default:""
	},university_roll_no:{
		type: Number,
		required:true
	},class_roll_no:{
		type: Number,
		required:true
	},student_name:{
		type: String,
		required:true
	},father_name:{
		type: String,
		required:true
	},section:{
		type: String,
		required:true
	},year_sem:{
		type: Number,
		required:true
	},branch:{
		type: String,
		required:true
	}
})
const staffSchema = new mongoose.Schema({
	profName:{
		type:String,
		required:true
	},
	email:{
		type:String,
		required:false,
		default:''
	}
})


// ----------------now creating modal ------------------
const Student = mongoose.model("Student",studentSchema )
const Staff = mongoose.model("Staff",staffSchema)
module.exports = {
	Student,
	Staff
}