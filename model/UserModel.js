// import mongoose from 'mongoose'
import mongoose from '../config/mongoose-connection.js'

const UserContactSchema =  mongoose.Schema({
    name : String,
    email:String,
    contact:Number,
    subject:String,
    message:String,
   
})
const subcriberSchema = mongoose.Schema({
    email : String
})

const signupSchema =  mongoose.Schema({
    username: String,
    email:String,
    password: String,
    cart :{
        type: Array,
        default: []
    },
    order:{
        type:Array,
        default: [],
        // date : Date.now()
    },
    otp : {
        type:Number,
        default : null
    }
})


const UserModelContact = mongoose.model("Contact",UserContactSchema)
const UserModelSubcribe = mongoose.model("Subcriber",subcriberSchema)
const UserModelSingup = mongoose.model("Singup",signupSchema)
export {UserModelContact,UserModelSubcribe,UserModelSingup};