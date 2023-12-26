const express = require('express');  // Add this line
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');  // Add this line

// middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

var postList = [];
var nameList = [];

// Handle connections
io.on('connection', function (socket) {
  console.log('A user connected');

  // Listen for 'sentPost' event from the client
  socket.on('sentPost', function (data) {
    // Log the received message
    console.log("SERVER POST:", data.post);
    console.log("SERVER ALL:", data);

    // Generate UUID for the name
    const post_id = uuidv4();
    if (data.parent ==null){
      postList.unshift({  post_id, name: data.userData.name,parent:null, data: data.post, vote: 1 });
    }else{
      console.log("Parent");
      postList.unshift({  post_id, name: data.userData.name,parent:data.parent, data: data.post, vote: 1 });
    }
    // Broadcast to sender
    io.to(socket.id).emit('serverReply', postList);
    // Broadcast the message to all other clients
    socket.broadcast.emit('serverReply', postList);
  });

  // Listen for 'sentPost' event from the client
  socket.on('sentVote', function (data) {
    // Log the received message
    console.log("SERVER:", data);
    // check if post exists
    const postIndex = postList.findIndex((i) => i.post_id === data.post_id);

    if (postIndex !== -1) {
      if(data.up){

        postList[postIndex].vote += 1;
      }else{
        postList[postIndex].vote -= 1;

      }

      io.emit('serverReply', postList);
    }
  });

  // Handle disconnections
  socket.on('disconnect', function () {
    console.log('User disconnected');
  });
});

// Handle login
app.post('/submitName', function (req, res) {
  console.log(req.body);
  const { name } = req.body;

  // Log the received name
  console.log("SERVER: Name submitted:", name);

  // Generate UUID for the name
  const user_id = uuidv4();

  count = 1;

  const submittedName = submitName(name, user_id, count);
  console.log("RECIEVEDNAME:", submittedName);
  console.log("cur List", postList)
  // Send a response to the client
  res.json({ message: 'Name submitted successfully', userData: submittedName, posts: postList });
});


function submitName(name, user_id, count) {
  const exists = nameList.find((i) => i.name === name);
  const newName = name + count;
  console.log(newName);
  if (!exists) {
    nameList.push({ name, user_id });
    console.log("NameListAdded:", nameList);
    return { name, user_id, count };
  } else {
    return submitName(newName, user_id, count + 1);
  }
}

// Start the server
const PORT = process.env.PORT || 3333;
http.listen(PORT, '0.0.0.0', function () {
  console.log(`Server is running on port ${PORT}`);
});