import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { UserModelContact,UserModelSubcribe,UserModelSingup} from './model/UserModel.js'
import dotenv from 'dotenv';

const app = express()
const port = process.env.PORT || 3000;
dotenv.config();

app.use(cors({
    origin: 'http://localhost:5173',  
    credentials: true  
}))
app.use(cookieParser())
app.use(bodyParser.json())

app.get("/",(req,res) => {
    res.send("hello")
})

app.get("/shopping",async (req,res) => {
    if(req.cookies.token !== undefined){
        let data = jwt.verify(req.cookies.token,process.env.SECRET)
        let userdata = await UserModelSingup.findOne({username : data.username})
        console.log(userdata.cart);
        
        res.json({data: userdata.cart,login:true, length: userdata.cart.length});
    }else{
        res.json({login:false});
    }
})

app.post("/shoppingAdd",async (req,res) => {
    if(req.cookies.token !== undefined){
        let data = jwt.verify(req.cookies.token,process.env.SECRET)
        const {username} = data
        const {image,description,price,color,contity} = req.body
        const user = await UserModelSingup.findOneAndUpdate(
            {username},
            { $push : {cart : {image,description,price,color,contity}}},
            {new: true}
        )
        res.json({status :true});
    }else{
        res.json(false);
    }
})

app.post("/Contact",async (req,res) => {
    const {Name,Email,Contact,Subject,Message} = req.body;
    const user = await UserModelContact.create({
        name : Name,
        email : Email,
        contact: Contact,
        subject: Subject,
        message : Message
    })
    console.log("object created", user); 
    res.send(user) 
})

app.post("/Subcribe",async (req,res) => {
    const subscriber = await UserModelSubcribe.create({
        email: req.body.Email
    })
    console.log(subscriber)
})
app.post("/Login", async (req, res) => {
    const { Username, password } = req.body;

    const user = await UserModelSingup.findOne({ username: Username });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(401).json({ message: "Invalid password" });
    }
    console.log("login ho gya ");
    
    // Generate JWT token
    let token = await jwt.sign({ username: user.username }, "secret");

    // Set the cookie with the token
    res.cookie("token", token);
    console.log(req.cookies.token);
    
    // Send success response
    res.json({ message: "successful"});
});

app.post("/Singup",async (req,res) => {
    const {username,email,password} = req.body
    const salt = await bcrypt.genSalt(10);
    const hashpassword = await bcrypt.hash(password,salt)
    const SingupUser = await UserModelSingup.create({
        username,
        email,
        password : hashpassword
    })
    console.log(SingupUser);
    res.send({status:true})  
})


app.listen(port,() =>{
    console.log(`successfull host on port ${port}`)
})