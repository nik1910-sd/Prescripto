import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";

// API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !password || !email) {
      return res.json({ success: false, message: "Missing Details" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a valid email" });
    }

    if (password.length < 8) {
      return res.json({ success: false, message: "Password must be 8+ chars" });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get user profile data
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ from middleware
    const userData = await userModel.findById(userId).select("-password");
    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, dob, gender } = req.body;

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Data Missing" });
    }

    const updateData = {
      name,
      phone,
      address: typeof address === "string" ? JSON.parse(address) : address,
      dob,
      gender,
    };

    if (req.file) {
      try {
        // Convert buffer → base64 for Cloudinary
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const imageUpload = await cloudinary.uploader.upload(dataURI, {
          resource_type: "image",
          folder: "user_profiles",
        });

        updateData.image = imageUpload.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.json({ success: false, message: "Image upload failed" });
      }
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .select("-password");

    res.json({ success: true, message: "Profile Updated", user: updatedUser });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.json({ success: false, message: error.message });
  }
};



//API to book appointment
const bookAppointment = async(req,res)=>{
  try{
    const {docId, slotDate, slotTime} = req.body;
    const userId = req.user.id; // Get userId from authenticated user

    // Validate required fields
    if (!docId || !slotDate || !slotTime) {
      return res.json({ success: false, message: "Missing required fields: docId, slotDate, slotTime" });
    }

    const docData = await doctorModel.findById(docId).select('-password');

    if(!docData.available){
      return res.json({success:false,message:'Doctor not available'});
    }

    let slots_booked = docData.slots_booked;

    //checking for slots availability
    if(slots_booked[slotDate]){
      if(slots_booked[slotDate].includes(slotTime)){
        return res.json({success:false,message:'Slot not available'});
      }
      else{
        slots_booked[slotDate].push(slotTime);
      }
    }
    else
    {
      slots_booked[slotDate]=[];
      slots_booked[slotDate].push(slotTime);
    }

    const userData = await userModel.findById(userId).select('-password');
    
    // Create a clean userData object with only the fields you need
    const userDataForAppointment = {
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
      dob: userData.dob,
      gender: userData.gender,
      image: userData.image
    };

    delete docData.slots_booked;

    const appointmentData = {
      userId,
      docId,
      userData: userDataForAppointment, // Use the cleaned user data
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now()
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    //save new slot data to doc data
    await doctorModel.findByIdAndUpdate(docId, {slots_booked});

    res.json({success:true,message:'Appointment Booked'});

  } catch(error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}


const listAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const appointments = await appointmentModel.find({ userId: userId })
      .populate('docId') // Change this to match your actual field name
      .sort({ createdAt: -1 });

    res.json({ success: true, appointments: appointments });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

//API to cancel appointment
const cancelAppointment = async (req,res)=>{
  try{
    const {appointmentId} = req.body
    const userId= req.user.id;
    const appointmentData = await appointmentModel.findById(appointmentId)

    //verify appointmnt user
    if(appointmentData.userId != userId)
    {
      return res.json({success:false,message:'Unauthorized action'})
    }

    await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})

    // releasing doctor slot

    const{docId,slotDate,slotTime}=appointmentData
    const doctorData = await doctorModel.findById(docId)

    let slots_booked= doctorData.slots_booked
    slots_booked[slotDate]=slots_booked[slotDate].filter(e => e!==slotTime)
    await doctorModel.findByIdAndUpdate(docId,{slots_booked})
    res.json({success:true , message:'Appointment cancelled'})
  }
    catch(error){
    console.log(error);
    res.json({ success: false, message: error.message });
  }
} 

// Api to make payment of appointment using razorpay


export { registerUser, loginUser, getProfile, updateProfile, bookAppointment,listAppointment,cancelAppointment};
