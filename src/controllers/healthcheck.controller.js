import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const healthcheckWithMessage = asyncHandler(async (req, res) => {

    const { message } = req.body

    if (!message) {
        throw new ApiError(400, "message required")
    }

    console.log("Helthcheck Message: ", message)

    return res
        .status(200)
        .json(new ApiResponse(200, message, "Health Status OK"))

})

const healthcheck = asyncHandler(async (req, res) => {


    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Health Status OK"))

})



export { healthcheck, healthcheckWithMessage }