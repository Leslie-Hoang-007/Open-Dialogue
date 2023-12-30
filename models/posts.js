const mongoose = require('mongoose');


const PostSchema = new mongoose.Schema({// schema is the structure of table/collection
    username: { type: String, required: true }, // string, required, unique
    parent:{type: mongoose.SchemaTypes.ObjectId, ref:"posts", required:false},
    text: { type: String, required: true}, // string, required, unique
    vote: {type:Number, required: true}
  },{timestamps:true});
  
const PostModel = mongoose.model("posts", PostSchema);// set userchema(model) to users collection

module.exports = PostModel;