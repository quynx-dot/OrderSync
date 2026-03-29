import express from 'express';
import dotenv from 'dotenv';
import cloudinary from "cloudinary";

dotenv.config();
const{CLOUD_NAME, CLOUD_API_KEY, CLOUD_SECRET_KEY}=process.env;
if(!CLOUD_NAME|| !CLOUD_API_KEY ||!CLOUD_SECRET_KEY){
  throw new Error("Missing Cloudinary Environment Variables");

}
cloudinary.v2.config({
  cloud_name:CLOUD_NAME,
  api_key:CLOUD_API_KEY,
  api_secret:CLOUD_SECRET_KEY,
})

const app = express();
app.use(express.json());


const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Utils service is running on port ${PORT}`);
});