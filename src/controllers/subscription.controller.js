import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription

    if (!channelId) {
        throw new ApiError(400, "channelId is required")
    }

    // find returns array []
    const isSubscribed = await Subscription.find(

        {
            subscriber: req.user._id,
            channel: channelId
        }
    )

    if (isSubscribed?.length === 0) {

        const newSub = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })

        if (!newSub) {
            throw new ApiError(500, "Something went wrong while Subscribing")
        }

        const data = {
            'Subscribed user': req.user?.username
        }
        return res
            .status(201)
            .json(
                new ApiResponse(201, data, "subscribed Successfully ")
            )

    }

    const unsub = await Subscription.findByIdAndDelete(isSubscribed[0]._id)

    if (!unsub) {
        throw new ApiError(500, "Something went wrong while Unsubscribing")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(204, {}, "Unsubscribed Successfully ")
        )

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!channelId) {
        throw new ApiError(400, "channelId is required")
    }
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "invalid ChannelId || objectId of userid is invalid ")
    }

    const subscriber = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },

        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers"
            }
        },

        {
            $addFields: {

                username: {
                    // $first: "$subscribers.username"  // can use also this
                    $arrayElemAt: ["$subscribers.username", 0]
                },
                fullName: {
                    $arrayElemAt: ["$subscribers.fullName", 0]
                },
                avatar: {
                    $arrayElemAt: ["$subscribers.avatar", 0]
                }
            }
        },

        {
            $project: {
                subscriber: 1,
                username: 1,
                fullName: 1,
                avatar: 1

            }

        }
    ])


    if (!subscriber?.length) {
        return res
            .status(404)
            .json(new ApiResponse(404, subscriber, "NO subscriber found"))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, subscriber, "subscriber list of a channel featched successfully"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!subscriberId) {
        throw new ApiError(400, "subscriberId is required")
    }
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "invalid subscriberId || objectId of subscriberId is invalid ")
    }

    const subscribedChannelList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {

            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedTo"
            }

        },
        {
            $addFields: {

                fullName: {
                    $arrayElemAt: ["$subscribedTo.fullName", 0]
                },
                username: {
                    $arrayElemAt: ["$subscribedTo.username", 0]
                },
                avatar: {
                    $arrayElemAt: ["$subscribedTo.avatar", 0]
                }
            }
        },
        {
            $project: {
                channel: 1,
                username: 1,
                fullName: 1,
                avatar: 1
            }
        }

    ])

    if (!subscribedChannelList?.length) {
        return res
            .status(404)
            .json(new ApiResponse(404, subscribedChannelList, "NO subscribed channel"))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, subscribedChannelList, "User's Subscribed channel fetched successfully"))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}