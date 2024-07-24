import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Subscription} from "../models/subscription.model.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { subscriberId } = req.body;

    // Validate ObjectIds
    if (!isValidObjectId(channelId) || !isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid channel or subscriber id");
    }

    // Check if channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Check if subscriber exists
    const subscriber = await User.findById(subscriberId);
    if (!subscriber) {
        throw new ApiError(404, "Subscriber not found");
    }

    // Check if subscription exists
    const subscription = await Subscription.findOne({ subscriber: subscriberId, channel: channelId });

    if (subscription) {
        // Remove subscription if it exists
        await Subscription.findByIdAndDelete(subscription._id);
    } else {
        // Add subscription if it does not exist
        await Subscription.create({ subscriber: subscriberId, channel: channelId });
    }

    // Send a success response
    res.status(200).json({ message: "Subscription toggled successfully" });
});


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Check if channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    try {
        // Aggregation pipeline to get subscribers
        const channelSubscribers = await Subscription.aggregate([
            { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscriberDetails"
                }
            },
            { $unwind: "$subscriberDetails" },
            { $project: 
                { 
                    subscriber: "$subscriberDetails.username",
                    _id: 0
             }}
        ]);

        // Check if there are no subscribers
        if (channelSubscribers.length === 0) {
            return res.status(404).json({ message: 'No subscribers found for this channel.' });
        }

        // Send the list of subscribers
        res.status(200).json({ subscribers: channelSubscribers.map(sub => sub.subscriber) });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.body;

    // Validate subscriberId
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    // Check if subscriber exists
    const subscriber = await User.findById(subscriberId);
    if (!subscriber) {
        throw new ApiError(404, "Subscriber not found");
    }

    try {
        // Aggregation pipeline to get subscribed channels
        const subscribedChannels = await Subscription.aggregate([
            { $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channelsSubscribed"
                }
            },
            { $unwind: "$channelsSubscribed" },
            { $project: 
                { 
                    channel: "$channelsSubscribed.username", // Assuming you want channel names
                    _id: 0
             }}
        ]);

        // Check if there are no subscribed channels
        if (subscribedChannels.length === 0) {
            return res.status(404).json({ message: 'No subscribed channels found for this user.' });
        }

        // Send the list of subscribed channels
        res.status(200).json({ channels: subscribedChannels.map(sub => sub.channel) });
    } catch (error) {
        console.error('Error fetching subscribed channels:', error); // Log detailed error
        res.status(500).json({ message: 'Server error', error: error.message }); // Send error message
    }
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}