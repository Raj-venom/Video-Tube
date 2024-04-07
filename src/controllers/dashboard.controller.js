import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.


})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const { page = 1, limit = 10, sortBy, sortType, } = req.query

    const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
    }

    const aggregate = Video.aggregate()

    aggregate.match(
        {
            owner: new mongoose.Types.ObjectId(req.user?._id)
        }
    )

    if (sortBy && sortType) {
        const sortOrder = sortType === "asc" ? 1 : -1;
        aggregate.sort({ [sortBy]: sortOrder })
    }

    const video = await Video.aggregatePaginate(aggregate, options)

    if (video.totalDocs === 0) {
        return res.status(204).json(new ApiResponse(204, {}, "NO videos found"))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "All uploaded videos fetched sucessfully"))

})

export {
    getChannelStats,
    getChannelVideos
}