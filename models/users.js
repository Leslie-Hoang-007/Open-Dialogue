const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({// schema is the structure of table/collection
    username: { type: String, required: true, unique: true }, // string, required, unique
    ip_address: { type: String, required: true, unique: true }, // string, required, unique
  },{timestamps:true});
  
const UserModel = mongoose.model("users", UserSchema);// set userchema(model) to users collection

module.exports = UserModel;