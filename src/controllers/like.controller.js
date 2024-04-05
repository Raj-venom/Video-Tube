import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    if (!videoId) {
        throw new ApiError(400, "videoId is required")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid videoId || objectId of videoId is invalid ")
    }

    const isVideoExists = await Video.findById(videoId)

    if (!isVideoExists) {
        throw new ApiError(404, "Failed to toggle like as Video doesn't exists")
    }

    const isVideoLiked = await Like.find(
        {
            likedBy: req.user?._id,
            video: videoId
        }
    )

    if (isVideoLiked?.length === 0) {

        const newVideoLike = await Like.create(
            {
                likedBy: req.user?._id,
                video: videoId
            }
        )

        if (!newVideoLike) {
            throw new ApiError(500, "something went wrong while adding Video like")
        }

        const likedUser = {
            'Video LikedBy': req.user?.username
        }

        return res
            .status(201)
            .json(new ApiResponse(201, likedUser, "Added Video Like successfully"))

    }

    const removeVideoLike = await Like.findByIdAndDelete(isVideoLiked[0]._id)

    if (!removeVideoLike) {
        throw new ApiError(500, "something went wrong while removing Video like")
    }

    return res
        .status(200)
        .json(new ApiResponse(404, {}, "Removed Video Like Successfully"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    if (!commentId) {
        throw new ApiError(400, "commentId is required")
    }
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "invalid commentId || objectId of commentId is invalid ")
    }

    const isCommentLiked = await Like.find(
        {
            likedBy: req.user?._id,
            comment: commentId
        }
    )

    // if no document found
    if (isCommentLiked?.length === 0) {

        const newCommentLike = await Like.create({
            likedBy: req.user?._id,
            comment: commentId
        })

        if (!newCommentLike) {
            throw new ApiError(500, "something went wrong while adding comment like")
        }

        const likedUser = {
            "Comment LikedBy": req.user?.username
        }

        return res
            .status(201)
            .json(
                new ApiResponse(201, likedUser, "Added Comment Like successfully")
            )
    }

    // if document found
    const removeCommentLike = await Like.findByIdAndDelete(isCommentLiked[0]._id)

    if (!removeCommentLike) {
        throw new ApiError(500, "something went wrong while removing Comment like")
    }

    return res
        .status(200)
        .json(new ApiResponse(404, {}, "Removed Comment Like Successfully")
        )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    if (!tweetId) {
        throw new ApiError(400, "tweetId is required")
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "invalid tweetId || objectId of tweetId is invalid ")
    }

    const isTweetLiked = await Like.find(
        {
            likedBy: req.user?._id,
            tweet: tweetId
        }
    )

    // if tweet is not liked
    if (isTweetLiked?.length === 0) {

        const newTweetLike = await Like.create({
            likedBy: req.user?._id,
            tweet: tweetId
        })

        if (!newTweetLike) {
            throw new ApiError(500, "something went wrong while adding Tweet like")
        }

        const likedUser = {
            "Tweet LikedBy": req.user?.username
        }

        return res
            .status(201)
            .json(new ApiResponse(201, likedUser, "Added Tweet Like successfully"))

    }

    const removeTweetLike = await Like.findByIdAndDelete(isTweetLiked[0]._id)

    if (!removeTweetLike) {
        throw new ApiError(500, "something went wrong while removing Tweet like")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Removed Tweet Like Successfully")
        )


}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const likedVideosList = await Like.aggregate([

        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: {
                    $ne: null
                }
            }
        },

        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",

                pipeline: [

                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    },

                    // project required field only of video
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1,
                            owner: 1
                        }
                    }


                ]
            }


        },
        {
            $addFields: {
                video: {
                    $first: "$video"
                }
            }
        },


    ])


    if (!likedVideosList?.length) {
        return res
            .status(404)
            .json(new ApiResponse(404, likedVideosList, "NO Liked Videos found"))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideosList, "Liked Video fetched successfully"))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}