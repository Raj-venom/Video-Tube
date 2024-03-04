import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import fs from "fs"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId) => {

    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // save refreshToken in database, so that we don't need to ask user password time to time

        // refreshToken filed in db ( refreshToken usermodels)
        user.refreshToken = refreshToken

        // save in database without All filed is not valid, like password, username etc are 'required: true' while saving in db these filed also required, so simply do "validateBeforeSave: false", so that we don't need other fileds while saving in db
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

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

    // wen get req.files access throw the multer

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

const loginUser = asyncHandler(async (req, res) => {

    // get data from frontend
    // validate -empty 
    // find user using username or email 
    // validate password
    // generate access, refresh tokens and store refresh token in db
    // return cookie- access token as response

    // get data from frontend
    const { username, password, email } = req.body

    // validate -empty
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    // find user using username or email 
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // validate password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }


    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    console.log("User logged In Successfully")

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken // sending accessToken, refreshToken in json also so that if api is for mobile app then it can use it.
                },
                "User logged In Successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {

    User.findByIdAndUpdate(

        req.user._id, // this req.user object from auth.middleware
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    console.log("User logged out Successfully")

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out Successfully"))


})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshtoken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshtoken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshtoken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        console.log("\n\n")
        console.log("incoming:\n", incomingRefreshtoken)
        console.log("db:\n", user.refreshToken)
        console.log("\n\n")

        if (incomingRefreshtoken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        // const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        console.log("new refresh token", newRefreshToken)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}