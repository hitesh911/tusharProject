
//Storing users connected in a room in memory
var user = {};
//Socket connection
function socket(io) {
    io.on('connection', (socket) => {

        socket.on('new-user-joined', (data) =>{
            
            user[socket.id] = data.username;
            socket.broadcast.emit("user-joined",{username:data.username})
        })
    
        //Emitting messages to Clients
        socket.on('chat', (data) =>{
            socket.broadcast.emit('receive', {username: data.username, msg: data.message});
        })
    
        //Broadcasting the user who is typing
        socket.on('typing', (data) => {
            socket.broadcast.emit('user-typing', {username:data.username})
        })
        // if user disconnect 
        socket.on('disconnect', (data) => {
            socket.broadcast.emit('user-left', {username:user[socket.id]})
            delete user[socket.id]
        })
    
    })
}

module.exports = socket;