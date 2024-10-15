const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));


app.get('/',(req,res) => {
    res.send("hello wwewerrorld");
})
app.get('/about',(req,res,next) => {
    return next(new Error("fucked up"))
})
app.use((err,req,res,next) => {
    console.log(err.stack);
    res.status(404).send("pata  nahi")
})

app.listen(3000) 