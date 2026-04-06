import mongoose from 'mongoose';

const connectDB = async () =>{
    try {
        mongoose.connection.on('connected', ()=> console.log('Database connected'));
        // REMOVED "/quickshow" from here because it is already in your .env file
        await mongoose.connect(process.env.MONGODB_URI)
    } catch (error) {
        console.log("Database Error:", error.message);
    }
}

export default connectDB;