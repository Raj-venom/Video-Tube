import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const { content } = req.body

    if (
        [content].some((field) => field?.trim() === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "Tweet content required")
    }

    const tweet = await Tweet.create({
        content: content?.trim(),
        owner: req.user?._id
    })

    const createdTweet = await Tweet.findById(tweet._id)

    if (!createdTweet) {
        throw new ApiError(500, "Something went wrong while Tweeting ")

    }

    return res
        .status(201)
        .json(new ApiResponse(200, createdTweet, "Tweeted Successfully"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const { userId } = req.params

    if (!userId) {
        throw new ApiError(400, "UserId is required")
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "invalid objectId of userid")
    }
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project: {
                content: 1,
            }
        }
    ])
    // console.log(typeof(tweets))
    // console.log("length:",tweets.length)

    if (!tweets?.length) {
        throw new ApiError(404, "No Tweet found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweets, "Tweets featched successfully")
        )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const { tweetId } = req.params
    const { content } = req.body

    if (!tweetId) {
        throw new ApiError(400, "TweetId required")
    }

    if (!content) {
        throw new ApiError(400, "Tweet content required")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(400, "Invalid TweetId")
    }

    console.log(`owner: ${tweet.owner},\n user: ${req.user?._id}`)

    // Check if the logged-in user is the owner of the tweet
    if (!tweet.owner.equals(req.user?._id)) {
        throw new ApiError(401, "unauthorized tweet owner")
    } else {
        console.log("id are equal")
    }

    const updateTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, { updateTweet }, "Tweet updated successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params

    if (!tweetId) {
        throw new ApiError(400, "TweetId required")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(400, "Invalid TweetId")
    }

    // Check if the logged-in user is the owner of the tweet
    if (!tweet.owner.equals(req.user?._id)) {
        throw new ApiError(401, "unauthorized tweet owner")
    }

    const result = await Tweet.findByIdAndDelete(tweetId)

    if (!result) {
        throw new ApiError(500, "Something went wrong while Deleting tweet")
    }

    return res
        .status(200)
        .json(new ApiResponse(204, {}, "Tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}