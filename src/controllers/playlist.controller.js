import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    //TODO: create playlist


    if (
        [name, description].some((field) => field?.trim() === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const playlist = await Playlist.create(

        {
            name: name?.trim(),
            description: description?.trim(),
            owner: req.user?._id
        }
    )

    if (!playlist) {
        throw new ApiError(500, "something went wrong while creating playlist")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, playlist, "Playlist created sucessfully"))


})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists

    if (!userId) {
        throw new ApiError(400, "userId is required")
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "invalid objectId of userId  || objectId of userId is invalid ")
    }

    const playlist = await Playlist.find(
        {
            owner: userId
        }
    ).select("-updatedAt -owner")

    // if no document found
    if (playlist?.length === 0) {
        throw new ApiError(404, "no playlist found")
    }

    console.log(playlist)

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"))


})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    if (!playlistId) {
        throw new ApiError(400, "playlistId is required")
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "invalid playlistId  || odject id is invalid")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },

        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",

                pipeline: [
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            videoFile: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
       
    ])

    if (!playlist) {
        throw new ApiError(400, "playlist Not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "playlist fetched successfully"))

})


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (
        [playlistId, videoId].some((field) => field?.trim() === "" || field?.trim() === undefined)
    ) {

        throw new ApiError(400, "All field is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid videoId || object id")
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "invalid playlistId || object id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found || Failed to add to playlist ")
    }

    const playlist = await Playlist.findById(playlistId)


    if (!playlist?.owner.equals(req.user?._id)) {
        throw new ApiError(401, "unauthorized Playlist owner")
    }


    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if (!updatePlaylist) {
        throw new ApiError(500, "something went wrong while adding video to updatePlaylist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatePlaylist, "playlist updated successfully"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    if (
        [playlistId, videoId].some((field) => field?.trim() === "" || field?.trim == undefined)
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(400, "unauthorized Playlist owner")
    }

    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlistId,

        {
            $pull: {
                videos: videoId
            }


        },
        { new: true }
    )

    if (!updatePlaylist) {
        throw new ApiError(500, "something went wrong while removing video from playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatePlaylist, "video removed from playlist"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    if (!playlistId) {
        throw new ApiError(400, "playlistId is required")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    if (!playlist?.owner.equals(req.user?._id)) {
        throw new ApiError(401, "unauthorized Playlist owner")
    }



    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletePlaylist) {
        throw new ApiError(500, "somehting went wrong while deleting playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(204, {}, "playlist deleted successfully"))

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    if (
        [playlistId, name, description].some((field) => field?.trim() === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "All fields are required")
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "invalid playlistId || objectId of playlistId is invalid")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist.owner?.equals(req.user?._id)) {
        throw new ApiError(401, "unauthorized Playlist owner")
    }


    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name: name?.trim(),
            description: description?.trim(),
        },
        { new: true }
    )

    if (!updatePlaylist) {
        throw new ApiError(500, "something went wrong while updating playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatePlaylist, "Playlist updated successfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
