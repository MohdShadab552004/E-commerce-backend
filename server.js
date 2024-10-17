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
        let total = 0;
        for (const key in userdata.cart) {
            total += userdata.cart[key].price; 
        }   
        res.json({data: userdata.cart, login:true, length: userdata.cart.length, Total:total});
    }else{
        res.json({login:false});
    }
})

app.post("/shoppingAdd",async (req,res) => {
    if(req.cookies.token !== undefined){
        let data = jwt.verify(req.cookies.token,process.env.SECRET)
        const {username} = data
        const {image,description,price,color,contity,id} = req.body
        const user = await UserModelSingup.findOneAndUpdate(
            {username},
            { $push : {cart : {id,image,description,price,color,contity}}},
            {new: true}
        )
        let total = 0;
        for (const key in user.cart) {
            total += user.cart[key].price; 
        }   

        res.json({status :true ,data: user.cart, length : user.cart.length, Total : total});
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
    res.json({status:true}) 
})

app.post("/Subcribe",async (req,res) => {
    const subscriber = await UserModelSubcribe.create({
        email: req.body.Email
    })
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
    // Generate JWT token
    let token = await jwt.sign({ username: user.username }, "secret");

    // Set the cookie with the token
    res.cookie("token", token);
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
    res.send({status:true})  
})

app.delete("/item/:id",async (req,res) => {
    
    if(req.cookies.token !== undefined){
        let data = jwt.verify(req.cookies.token,process.env.SECRET)
        console.log(data.username);
        
        const Username = data.username;
        const user = await UserModelSingup.findOne({username : Username });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            
            // Filter out the item with the provided id
            user.cart = user.cart.filter(item => item.id.toString() !== req.params.id);

           // Save the updated user document
            await user.save();
            
            let total = 0;
            for (const key in user.cart) {
                total += user.cart[key].price; 
            }   
            // Respond with success
            res.json({ success: true, message: "Item deleted successfully", cart: user.cart, length:user.cart.length ,Total : total});
    }else{
        res.json(false);
    }
})


app.listen(port,() =>{
    console.log(`successfull host on port ${port}`)
})