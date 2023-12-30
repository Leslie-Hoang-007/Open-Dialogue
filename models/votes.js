const mongoose = require('mongoose');


const VoteSchema = new mongoose.Schema({// schema is the structure of table/collection
    user_id: { type: mongoose.SchemaTypes.ObjectId, ref:"users", required: true }, // string, required, unique
    post_id:{type: mongoose.SchemaTypes.ObjectId, ref:"posts", required:true},
    up: { type: Boolean,default: false, required: true},
    down: { type: Boolean,default: false, required: true},
  },{timestamps:true});
  
const VoteModel = mongoose.model("votes", VoteSchema);// set userchema(model) to users collection

module.exports = VoteModel;