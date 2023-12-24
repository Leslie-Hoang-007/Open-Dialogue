var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Handle connections
io.on('connection', function (socket) {
  console.log('A user connected');

  // Listen for 'sentPost' event from the client
  socket.on('sentPost', function (post) {
    // Log the received message
    console.log("SERVER:", post);

    // Broadcast to sender
    
    io.to(socket.id).emit('serverReply', post);
    // Broadcast the message to all other clients
    socket.broadcast.emit('serverReply', post);
  });

  // Handle disconnections
  socket.on('disconnect', function () {
    console.log('User disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 3333;
http.listen(PORT, '0.0.0.0', function () {
  console.log(`Server is running on port ${PORT}`);
});