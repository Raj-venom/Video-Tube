import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
    }

    const aggregate = Video.aggregate()


    if (query) {
        aggregate.match({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        })
    }

    if (sortBy && sortType) {
        const sortOrder = sortType === 'asc' ? 1 : -1;
        aggregate.sort({ [sortBy]: sortOrder })
    }

    if (userId) {
        aggregate.match(
            {
                owner: new mongoose.Types.ObjectId(userId)
            }
        )
    }

    aggregate.lookup(
        {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "channel"
        }
    )

    aggregate.addFields(
        {
            channel: {
                $first: "$channel"
            }
        }
    )

    aggregate.project(
        {
            title: 1,
            description: 1,
            videoFile: 1,
            thumbnail: 1,
            duration: 1,
            views: 1,
            isPublished: 1,
            createdAt: 1,
            channel: {
                _id: 1,
                username: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    )

    const video = await Video.aggregatePaginate(aggregate, options)

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched sucessfully"))


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    // get all video details from frontend
    // validate all field is present or not

    // (upload videofile, thumbnail to server using multer)
    // validate both videofile, thumbnail uploaded on local server

    // upload videofile, thumbnail to cloudnary 
    // validate both file 

    // database entry => create new document
    // if new document created send res 200, else 500


    if (
        [title, description].some((field) => field?.trim() === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "All fields are required")
    }


    let videoLocalFile;

    if (req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0) {
        videoLocalFile = req.files.videoFile[0].path
    }

    let thumbnailLocalFile;

    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalFile = req.files.thumbnail[0].path
    }


    const cloudVideo = await uploadOnCloudinary(videoLocalFile)
    const cloudThumbnail = await uploadOnCloudinary(thumbnailLocalFile)

    if (!cloudVideo) {
        throw new ApiError(400, "Video file is required")
    }

    if (!cloudThumbnail) {
        throw new ApiError(400, "Thumbnail is required")
    }


    const video = await Video.create({

        title,
        description,
        videoFile: cloudVideo.url,
        thumbnail: cloudThumbnail.url,
        duration: cloudVideo.duration,
        owner: req.user?._id
    })



    if (!video) {
        throw new ApiError(500, "something went while uploding the video")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video Uploaded Successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId) {
        throw new ApiError(400, "videoId is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid objectId of videoId  || objectId of videoId is invalid ")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "No Video found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body

    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "VideoId is invalid || object id is invalid")
    }

    // finding thumbnail url on dataabase
    const oldVideo = await Video.findById(videoId)

    if (!oldVideo) {
        throw new ApiError(400, "Invalid videoId")
    }

    // Check if the logged-in user is the owner of the Video
    if (!oldVideo.owner.equals(req.user?._id)) {
        throw new ApiError(401, "unauthorized Video owner")
    }


    let thumbnailLocalFile;

    if (req.file?.path) {
        thumbnailLocalFile = req.file.path
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalFile)



    // updating All fields
    if (
        !([title, description].some((field) => field?.trim() === "" || field?.trim() == undefined))
    ) {

        const video = await Video.findByIdAndUpdate(

            videoId,
            {
                $set: {
                    title,
                    description,
                    thumbnail: thumbnail?.url || oldVideo.thumbnail
                }
            },
            { new: true }
        )

        if (!video) {
            throw new ApiError(500, "Something went wrong while updating video")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, video, "Video updated successfully"))


    }

    // updating if some fields
    if (title) {

        const video = await Video.findByIdAndUpdate(

            videoId,
            {
                $set: {
                    title,
                    thumbnail: thumbnail?.url || oldVideo.thumbnail
                }
            },
            { new: true }
        )

        if (!video) {
            throw new ApiError(500, "something went wrong while updating video")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, video, "Video updated successfully"))

    }

    if (description) {

        const video = await Video.findByIdAndUpdate(

            videoId,
            {
                $set: {
                    description,
                    thumbnail: thumbnail?.url || oldVideo.thumbnail
                }
            },
            { new: true }
        )

        if (!video) {
            throw new ApiError(500, "something went wrong while updating video")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, video, "Video updated successfully"))

    }

    if (thumbnail) {
        const video = await Video.findByIdAndUpdate(

            videoId,
            {
                $set: {
                    thumbnail: thumbnail.url
                }
            },
            {
                new: true
            }
        )

        if (!video) {
            throw new ApiError(500, "something went while updating video")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, video, "Video updated successfully"))

    }

})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "invalid videoId.")
    }

    if (!video.owner.equals(req.user?._id)) {
        throw new ApiError(401, "unauthorized video owner")
    }

    const result = await Video.findByIdAndDelete(videoId)

    if (!result) {
        throw new ApiError(500, "something went wrong while deleting video")
    }

    return res
        .status(200)
        .json(new ApiResponse(204, {}, "Video deleted successfully"))


})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "videoId is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid objectId of videoId  || objectId of videoId is invalid ")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    // Check if the logged-in user is the owner of the video
    if (!video.owner.equals(req.user?._id)) {
        throw new ApiError(401, "unauthorized video owner")
    }


    const update = !(video.isPublished)

    const updateVideo = await Video.findByIdAndUpdate(

        videoId,
        {
            $set: {
                isPublished: update
            }
        },
        { new: true }
    )

    if (!updateVideo) {
        throw new ApiError(500, "something went while toggling publish status")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updateVideo, "Published Status toggle successfully"))


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
