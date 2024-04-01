import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"



import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
    }

    const aggregate = Comment.aggregate()

    aggregate.match(
        {
            video: new mongoose.Types.ObjectId(videoId)
        }
    )

    aggregate.lookup(
        {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
        }
    )

    aggregate.addFields(
        {
            owner: {
                $first: "$owner"
            }
        }
    )

    aggregate.project(
        {
            _id: 1,
            content: 1,
            owner: {
                _id: 1,
                username: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    )

    const comment = await Comment.aggregatePaginate(aggregate, options)

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Commnet fetched sucessfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const { videoId } = req.params

    const { content } = req.body

    if (!videoId) {
        throw new ApiError(400, "videoId is required")
    }

    if (!content) {
        throw new ApiError(400, "comment content is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid vidoeId || object Id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const comment = await Comment.create(
        {
            content: content?.trim(),
            video: videoId,
            owner: req.user?._id

        }
    )

    if (!comment) {
        throw new ApiError(500, "something went wrong while adding comment")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment Added successfully"))


})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "invalid commentId || object Id")
    }

    if (!content) {
        throw new ApiError(400, "comment content required")
    }

    const comment = await Comment.findById(commentId)

    if (!comment?.owner?.equals(req.user?._id)) {
        throw new ApiError(401, "unauthorized comment owner")
    }

    const updateComment = await Comment.findByIdAndUpdate(

        commentId,
        {
            $set: {
                content: content?.trim()
            }
        },
        { new: true }
    )

    if (!updateComment) {
        throw new ApiError(500, "something went wrong while updating comment")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updateComment, "comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId || object id")
    }

    const comment = await Comment.findById(commentId)
    const video = await Video.findById(comment?.video)

    if (!comment) {
        throw new ApiError(404, "commentId not found")
    }

    if (!video) {
        throw new ApiError(404, "videoId not found")
    }

    if (!comment?.owner?.equals(req.user?._id) && !video?.owner?.equals(req.user?._id)) {
        throw new ApiError(401, "unauthorized comment owner")
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId)

    if (!deleteComment) {
        throw new ApiError(500, "Failed to delete comment")
    }

    return res
        .status(200)
        .json(new ApiResponse(204, {}, "comment deleted sucessfully"))



})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
