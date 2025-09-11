import jwt from "jsonwebtoken";

//  Doc authentication middleware
const authDoctor = async (req, res, next) => {
  try {
  //  const dtoken = req.headers.token || req.headers.authorization?.split(" ")[1];
    const {dtoken} = req.headers
    if (!dtoken) {

        return res.json({success:false , message:'Not Authorized Login Again'})
   

    }

    // const decoded = jwt.verify(dtoken, process.env.JWT_SECRET);
    // req.doc = { id: decoded.id };
    const token_decode = jwt.verify(dtoken,process.env.JWT_SECRET)
    req.docId = token_decode.id
    next()
  } catch (error) {
    console.log("Auth error:", error);
    //return res.status(401).json({ success: false, message: "Invalid token" });
    res.json({success:false,message:error.message})
}
};

export default authDoctor
