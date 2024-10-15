// config/mongoose-connection.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log('Database connected');
  })
  .catch((err) => {
    console.log('Error connecting to database', err);
  });

export default mongoose; // Export the entire mongoose object
