import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse }  from "../utils/ApiResponse.js"
import fs from "fs"


const registerUser = asyncHandler(async (req, res) => {

    // get user details from frontend
    // validation - not empty
    // check if user already exits using: username, email
    // check for images, check for avtar,
    // upload them to cloudinary- avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response


    // get user details from frontend
    const { fullName, email, username, password } = req.body

    console.log("email: ", email)
    console.log("password: ", password)


    // validation - not empty
    if (
        // check if any field is empty or not
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All field are required")        
    }

    // if finds any of the field in data base it return true
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // upload files to local Server
    // const avatarLocalPath = req.files?.avatar[0]?.path;   
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let avatarLocalPath
    let coverImageLocalPath

    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path;
    }

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        fs.unlinkSync(coverImageLocalPath) // Removes the coverImage from local server when avatar not found
        throw new ApiError(400, "Avatar file is required")
    }

    // upload files to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    // create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url, // cloudinary's response.url
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // removes password and refresh token field from response
    const createUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for user creation
    if (!createUser) {
        throw new ApiError(500, "Something went wrong while registering the user")

    } else {

        console.log(`\nUser registered sucessfully \n`)
    }

    // return response
    return res.status(201).json(
        new ApiResponse(200, createUser, "User registered successfully")
    )


})






export { registerUser }