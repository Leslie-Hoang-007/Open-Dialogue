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

var postList=[];
var nameList=[];

// Handle connections
io.on('connection', function (socket) {
  console.log('A user connected');

  // Listen for 'sentPost' event from the client
  socket.on('sentPost', function (data) {
    // Log the received message
    console.log("SERVER:", data.post);
    console.log("SERVER USER:", data.userData);

    postList.unshift({name: data.userData.name, data:data.post});
    // Broadcast to sender
    io.to(socket.id).emit('serverReply', postList);
    // Broadcast the message to all other clients
    socket.broadcast.emit('serverReply', postList);
  });

  // Handle disconnections
  socket.on('disconnect', function () {
    console.log('User disconnected');
  });
});


app.post('/submitName', function (req, res) {
  console.log(req.body);
  const {name} = req.body;

  // Log the received name
  console.log("SERVER: Name submitted:", name);

  // Generate UUID for the name
  const user_id = uuidv4();

  count = 1;

  const submittedName = submitName(name,user_id,count);
  console.log("RECIEVEDNAME:",submittedName);
  console.log("cur List",postList)
  // Send a response to the client
  res.json({ message: 'Name submitted successfully' ,userData: submittedName, posts:postList});
});


function submitName(name,user_id,count){
  const exists = nameList.find((i) => i.name === name);
  const newName = name+count;
  console.log(newName);
  if (!exists){
    nameList.push({ name, user_id });
    console.log("NameListAdded:",nameList);
    return { name, user_id, count };
  } else{
    return submitName(newName,user_id,count+1);
  }
}

// Start the server
const PORT = process.env.PORT || 3333;
http.listen(PORT, '0.0.0.0', function () {
  console.log(`Server is running on port ${PORT}`);
});