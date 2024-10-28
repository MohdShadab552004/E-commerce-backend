import express from 'express'
import bcrypt, { genSalt } from 'bcrypt'
import jwt from 'jsonwebtoken'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import nodemailer from 'nodemailer'
import { UserModelContact, UserModelSubcribe, UserModelSingup } from './model/UserModel.js'
import dotenv from 'dotenv';

const app = express()
const port = process.env.PORT || 3000;
dotenv.config();

app.use(cors({
    origin: 'http://localhost:5173',  
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE'], // Include DELETE method
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cookieParser());
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("hello");
});

app.get("/shopping", async (req, res) => {
    try {
        if (req.cookies.token !== undefined) {
            let data = jwt.verify(req.cookies.token, process.env.SECRET);
            let userdata = await UserModelSingup.findOne({ username: data.username });
            let total = 0;
            for (const key in userdata.cart) {
                total += userdata.cart[key].price;
            }   
            res.json({ data: userdata.cart, login: true, length: userdata.cart.length, Total: total });
        } else {
            res.json({ login: false });
        }
    } catch (error) {
        console.error("Error in /shopping:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/logout", (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
        });
        res.json({ logout: true });
    } catch (error) {
        console.error("Error in /logout:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
const sendEmail = async (recipientEmail, otp) => {

    const transporter = nodemailer.createTransport({
        service:"gmail",
        port: 465,
        secure:true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from:{
            name : 'CollStuff',
            address:process.env.EMAIL_USER,
            },
        to: recipientEmail,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
app.post("/forget",async (req,res) => {
    try{
        const email = req.body.email;
        const user = await  UserModelSingup.findOne({email});
        if(!user){
            console.log("user not found"); 
            res.json({found:false})
        }
       
        const otp = Math.floor(100000 + Math.random() * 900000);
        await sendEmail(email,otp)
        const usernew = await UserModelSingup.findOneAndUpdate(
            { email },
            { otp : otp },
            { new: true }
        );
        console.log(usernew);
        res.status(200).json({message:`OTP sent to ${email}: ${otp}`,found : true});
    }catch(err){
        console.error("Error in /forget:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
})
app.post("/verify",async (req,res) => {
    try{
        const {otp,email} = req.body;
        const user = await UserModelSingup.findOne({email});
        if(Number(otp) === user.otp){
            res.json({verify : true,});
        }else{
            res.json({verify : false});
        }

    }catch(err){
        console.error("Error in /verify:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
})
app.post("/updatepassword",async (req,res) => {
    try{
        const {password,email} = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashpassword = await bcrypt.hash(password, salt);        
        const user = await UserModelSingup.findOneAndUpdate(
            {email},
            {hashpassword},
            {new:true}
        )
        
        res.json({successfull:true})
    }catch(err){
        console.error("Error in /shoppingAdd:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})
app.post("/shoppingAdd", async (req, res) => {
    try {
        if (req.cookies.token !== undefined) {
            let data = jwt.verify(req.cookies.token, process.env.SECRET);
            const { username } = data;
            const { image, description, price, color, contity, id } = req.body;

            const user = await UserModelSingup.findOneAndUpdate(
                { username },
                { $push: { cart: { id, image, description, price, color, contity } } },
                { new: true }
            );
            
            let total = 0;
            for (const key in user.cart) {
                total += user.cart[key].price;
            }

            res.json({ status: true, data: user.cart, length: user.cart.length, Total: total });
        } else {
            res.json(false);
        }
    } catch (error) {
        console.error("Error in /shoppingAdd:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/myorder",async (req,res) => {
    try {
        if (req.cookies.token !== undefined) {
            let data = jwt.verify(req.cookies.token, process.env.SECRET);
            const { username } = data;

            const user = await UserModelSingup.findOne({ username });
            console.log(user);
            
            res.json({status: true, myorder : user.order});
        } else {
            res.json(false);
        }
    } catch (error) {
        console.error("Error in /myorder:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

app.post("/order",async (req,res) => {
    try {
        if (req.cookies.token !== undefined) {
            let data = jwt.verify(req.cookies.token, process.env.SECRET);
            const { username } = data;
            const {Area_building,House_no,email,name,pincode,id,mode,items,total} = req.body;

            const user = await UserModelSingup.findOneAndUpdate(
                { username },
                { $push: { order: { id,Area_building,House_no,email,name,pincode,mode,items,total} } },
                { new: true }
            );
            
            res.json({status: true});
        } else {
            res.json(false);
        }
    } catch (error) {
        console.error("Error in /shoppingAdd:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})
app.post("/contact", async (req, res) => {
    try {
        const { Name, Email, Contact, Subject, Message } = req.body;
        const user = await UserModelContact.create({
            name: Name,
            email: Email,
            contact: Contact,
            subject: Subject,
            message: Message
        });
        res.json({ status: true });
    } catch (error) {
        console.error("Error in /Contact:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/subcribe", async (req, res) => {
    try {
        const subscriber = await UserModelSubcribe.create({ email: req.body.Email });
        res.json({ subscribe: true });
    } catch (error) {
        console.error("Error in /Subcribe:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/login", async (req, res) => {
    try {
        console.log("logining start");
        
        const { Username, password } = req.body;
        const user = await UserModelSingup.findOne({ username: Username });

        if (!user) {
            return res.status(404).json({ login: false, message: "User not found" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ login: false, message: "Invalid password" });
        }

        // Generate JWT token
        let token = await jwt.sign({ username: user.username }, process.env.SECRET);
        res.cookie("token", token, {httpOnly:true,secure:true,sameSite: 'None'});
        res.json({ login: true, message: "Login successful" });
    } catch (error) {
        console.error("Error in /Login:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/singup", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const isuser = await UserModelSingup.findOne({ username });

        if (isuser) {
            return res.status(409).json({ login: false, message: "Username already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashpassword = await bcrypt.hash(password, salt);
        const SingupUser = await UserModelSingup.create({
            username,
            email,
            password: hashpassword
        });
        
        let token = await jwt.sign({ username }, process.env.SECRET);
        res.cookie("token", token);

        res.json({ login: true, message: "Signup successful" });
    } catch (error) {
        console.error("Error in /Singup:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.delete("/item/:id", async (req, res) => {
    try {
        if (req.cookies.token !== undefined) {
            let data = jwt.verify(req.cookies.token, process.env.SECRET);
            const Username = data.username;
            const user = await UserModelSingup.findOne({ username: Username });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            user.cart = user.cart.filter(item => item.id.toString() !== req.params.id);
            await user.save();

            let total = 0;
            for (const key in user.cart) {
                total += user.cart[key].price;
            }

            res.json({ success: true, message: "Item deleted successfully", cart: user.cart, length: user.cart.length, Total: total });
        } else {
            res.json(false);
        }
    } catch (error) {
        console.error("Error in /item/:id:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Successfully hosted on port ${port}`);
});
