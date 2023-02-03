//To get HTML elements
const message = document.getElementById('message_input');
const sendForm = document.getElementById('send-container');
const messageContainer = document.querySelector("#message-container")
const typingNote = document.getElementById("typing-note")
//Socket server URL
const socket = io.connect( `http://${window.location.host}`);

const username = document.getElementById("student-name").innerHTML
// utility functions 
function appendMsg(name,msg,position){
    const msgPara = document.createElement('p')
    msgPara.innerHTML = msg
    const msgName = document.createElement('small')
    msgName.innerHTML = name
    msgName.classList.add("msg-name")
    const newMessage = document.createElement('div')
    newMessage.classList.add("chat-message")
    newMessage.classList.add(position)
    newMessage.append(msgName)
    newMessage.append(msgPara)
    messageContainer.append(newMessage)
    messageContainer.scrollTop = messageContainer.scrollHeight;
    typingNote.innerHTML = ""

}
function appendNotification(text){
    const notification = document.createElement('div')
    notification.innerHTML = text
    notification.classList.add("notification")
    messageContainer.append(notification)
    messageContainer.scrollTop = messageContainer.scrollHeight;
}
// -----------------Events listing section  ---------------
socket.emit('new-user-joined', {
    username: username
})

//Sending data when user clicks send
sendForm.addEventListener('submit', (e) =>{
    e.preventDefault()
    if(message != ""){
        appendMsg(username,message.value,"right-chat")
        socket.emit('chat', {
            username: username,
            message: message.value,
        })
        message.value = '';
    }else{
        //pass
    }
    
})

//Sending username if the user is typing
message.addEventListener('keypress', () => {
    socket.emit('typing', {username: username})
})

// -----------------------Displaying section -------------------

//Displaying if new user has joined the room
socket.on('user-joined', (data)=>{
    // add notification inside message container 
    appendNotification(`${data.username} has joined the chat`)
})

//Displaying new received messege
socket.on('receive', (data) => {
    appendMsg(data.username,data.msg,"left-chat")

})

//Displaying if a user is typing
socket.on('user-typing', (data) => {
    typingNote.innerHTML = `${data.username} is typing..`

})

//Displaying if a user leave the chat
socket.on('user-left', (data) => {
    // add notification that user is typing 
    appendNotification(`${data.username} left the chat`)
})
