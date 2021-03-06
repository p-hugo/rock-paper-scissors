const express = require('express'),
    socket = require('socket.io'),
    app = express();

let server = app.listen(5000, () => {
    console.log("App running on port 5000");
});

let io = socket(server);
let connectedUsers = [];
io.on('connection', (player) => {
    console.log(`New player: ${player.id}`);

    // Give the user its id
    player.emit("id", { id: player.id });

    // Lets the user know who is connected when he enters the game
    player.emit('entering', { players: [...connectedUsers] });

    // When a new player connects, let people know
    player.on("connected", ({ user }) => {
        let data = { ...user, id: player.id };
        player.broadcast.emit("connected", { user: { ...data } });
        connectedUsers.push({ ...data });
    });

    // When a player sends a match request
    player.on("match", ({ id }) => {
        let sender = find(player.id, connectedUsers);
        let receiver = find(id, connectedUsers);
        console.log(`${sender.name} is trying to battle with ${receiver.name}`);
        player.broadcast.to(id).emit('match', { sender });
    });

    // When the recipient of a match request answers
    player.on('confirm', ({ id, answer }) => {
        if (answer) console.log("Battle confirmed!");
        else console.log("Battle declined");

        player.broadcast.to(id).emit('confirm', { answer });
    });

    // When the time is up and the users send their choices to each other
    player.on('choice', ({ to, choice }) => {
        console.log(choice);
        player.broadcast.to(to).emit('choice', { choice });
    });

    // When player sends an update
    player.on("update", ({user}) => {
        console.log("We got an update!");
        console.log(user);
        player.broadcast.emit("update", ({user}));
    });

    // When a player leaves
    player.on("leave", ({ id }) => {
        console.log(`Player ${player.id} left`);
        io.sockets.emit("leave", { id: player.id });
        connectedUsers = connectedUsers.filter(v => v.id !== id);
        console.log(connectedUsers);
        player.disconnect(0);
    });
});

/**
 * Finds a user by its id on a given array and returns it
 * @param id | id of the user to be returned
 * @param arr | array containing a list of users
 */
function find(id, arr) {
    for (let u of arr) {
        if (u.id === id)
            return u;
    }
}