const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OfferSchema = new Schema({
title: String,
description: String,
category: {
    type: String,
    enum: ['Item','Service']}, 
    location: String,
    imageUrl: String,
    owner: {
type: mongoose.Schema.Types.ObjectId,
 ref: 'user'},
status: {type: String,
    enum:['Available', 'Traded'],
    default: 'Available'}
})

module.exports = mongoose.model('Offer', OfferSchema);
