import { response } from "express";
import  asyncHandler  from "../utils/asyncHandler.js";
import ApiError from '../utils/apierror.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utils/cloudniary.js'
import ApiResponse from "../utils/ApiResponse.js";


const registerUser = asyncHandler( async (req, res) => {

//  STEPS

// Get user details
// Validation - not empty
// Check if user already exists: username, email,
// Check for images, Check for Avatar
// Upload them to cloudinary, avatar
// Create USer Object - Create entry call in DB
// Remove password and refresh token field from response
// Check for usegr creation
// Return response

  const {fullName, email, username, password} = req.body
  // console.log("email: ", email);


if(
  [ fullName, email, username, password].some((field) => field?.trim() === "")
)
{
   throw ApiError(400, "All fields are required")
}

const existingUser = await User.findOne({
  $or: [{ username },  { email }]
})

if(existingUser)
{
  throw new ApiError(409, "User with email or user already exists")
}

console.log(req.files);

const avatarLocalPath = req.files?.avatar[0]?.path;
// const coverImageLocalPath = req.files?.coverImage[0]?.path ;

let coverImageLocalPath;

if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
{
    coverImageLocalPath = req.files.coverImage[0]?.path;
}

if(!avatarLocalPath)
{
  throw new ApiError(400, "Avatar file is required")
}

const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if(!avatar)
{
  throw new ApiError(400, "Avatar file is required")
}

const user = await User.create(
  {
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken "
  ) 

  if(!createdUser)
  {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
  )

})

export default registerUser;