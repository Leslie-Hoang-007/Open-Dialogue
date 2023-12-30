const express = require('express');  // Add this line
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');  // Add this line
const mongoose = require('mongoose');
const UserModel = require("./models/users.js");
const PostModel = require("./models/posts.js");
const VoteModel = require("./models/votes.js");
const { uniqueNamesGenerator, colors, animals } = require('unique-names-generator');

// start .env variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));


//
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Handle connections
io.on('connection', function (socket) {
  console.log('A user connected');

  // Listen for 'sentPost' event from the client
  socket.on('sentPost', async function (data) {
    // Log the received message
    console.log("SERVER POST:", data.post);
    console.log("SERVER ALL:", data);

    // add to mongodb
    if (data.parent == null) {
      const newPost = new PostModel({ username: data.userData.username, text: data.post, vote: 1 })
      await newPost.save();
    } else {// has parent
      console.log("Parent");
      const newPost = new PostModel({ username: data.userData.username, parent: data.parent, text: data.post, vote: 1 })
      await newPost.save();
    }
    // bordcast to all after post added
    const allPosts = await PostModel.find();
    io.emit('serverReply', allPosts);
    // // Broadcast to sender
    // io.to(socket.id).emit('serverReply', postList);
    // // Broadcast the message to all other clients
    // socket.broadcast.emit('serverReply', postList);

  });

  // Listen for 'sentPost' event from the client
  socket.on('sentVote', async function (data) {
    // Log the received message
    console.log("SERVER:", data);

    // select update
    try {
      const filter = { _id: data.post_id };
      // find vote
      const selVote = await VoteModel.findOne({user_id: data.user_id, post_id: data.post_id});
      if (data.up) {
        if(selVote){
          if (selVote.up == false){// found update
            selVote.up = true;
            await selVote.save();
            await PostModel.findOneAndUpdate(filter, { $inc: { vote: 1 } });
          }else{
            return;// already up voted
          }
        }else{// not found create
          const newVote = new VoteModel({user_id: data.user_id, post_id: data.post_id, up:true});
          await newVote.save();
          await PostModel.findOneAndUpdate(filter, { $inc: { vote: 1 } });
        }
        
      } else {
        if(selVote){
          if (selVote.down == false){// found and update
            selVote.down = true;
            await selVote.save()
            await PostModel.findOneAndUpdate(filter, { $inc: { vote: -1 } });
          }else{
            return;;// already down voted
          }
        }else{// not found create
          const newVote = new VoteModel({user_id: data.user_id, post_id: data.post_id, up:true});
          await newVote.save();
          await PostModel.findOneAndUpdate(filter, { $inc: { vote: -1 } });
        }
      }
    } catch (error) {
      console.error('Error updating post:', error.message);
    }

    // emit updated voteing list to user
    const userVotes = await VoteModel.find({ user_id: data.user_id });
    io.to(socket.id).emit('serverVoteReply', userVotes);
    
    // bordcast post update to all
    const allPosts = await PostModel.find();
    io.emit('serverReply', allPosts);
  });

  // Handle disconnections
  socket.on('disconnect', function () {
    console.log('User disconnected');
  });
});

// Handle login
app.post('/submitName', async function (req, res) {
  // get ip
  const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  // gen user data
  const userData = await generateName(userIp);
  console.log("GEN NAME", userData);

  const allPosts = await PostModel.find();
  const userVotes = await VoteModel.find({ user_id: userData._id });
  // Send a response to the client
  res.json({ message: 'User submitted successfully', userData, posts: allPosts , votes: userVotes});
});
// Random name generator
async function generateName(userIp) {
  const resultIp = await UserModel.findOne({ ip_address: userIp });

  if (!resultIp) {
    // generate randome name
    const randomName = uniqueNamesGenerator({ dictionaries: [colors, animals], separator: ' ', style: 'capital' });
    const resultName = await UserModel.findOne({ username: randomName });

    if (!resultName) {// none founf
      const newUser = new UserModel({ username: randomName, ip_address: userIp });
      await newUser.save();
      return newUser
    } else {// found recuresive call
      return generateName(userIP);
    }
  } else {
    return resultIp;
  }
};

// get server IP
async function getServIp() {
  var servIp = "";
  await fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(({ ip }) => {
      servIp = ip; // Assign to servIp directly
      console.log("Server IP:", servIp);
    });
  return servIp;
}

// Start the server
async function startServ() {
  const servIp = await getServIp();
  const PORT = process.env.PORT || 3333;
  // connect to db
  const dbURI = process.env.dbURI;
  await mongoose.connect(dbURI)
    .then((result) => console.log('Connected to MongoDB'))
    .catch((err) => console.log(err));
  // start server
  http.listen(PORT, '0.0.0.0', function () {
    console.log(`Server is running on http://${servIp}:${PORT}`);
  });
}

startServ();