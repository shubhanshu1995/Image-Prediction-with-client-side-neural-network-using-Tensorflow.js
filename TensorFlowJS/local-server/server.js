/***************************** Enter Express for Node.js *****************************************/
//Express is a minimalistic framework very similar to flask but it's for node.js not python
//Node.js is an open source runtime environment that executes JS on the server side
//Historically JS has been used mainly for client side applications like browser applications
//Now we have node, we have express. We'll write a node program that will start the express server server &
//will host the files that we specified

let express = require("express"); //imports the express module & give our program access to it
let app = express(); //creating the express application

// Express app is essentially a series of calls to functions that we call middleware functions
// Middleware functions have access to HTTP request and response objects as well as the next functions
// in the applications request response cycle which just passes control to the next handler

// We are doing two things: 1) logging information about the request to the terminal where the express server is running
// & then we pass the control to the next handler

// Calls to app.use is only called once and that's when the server is started
//app.use calls specifies the middleware functions & calls to those middleware functions will be executed 
// each time a request comes into the server 

app.use(function(req, res, next) { //middleware functions
    console.log(`${new Date()} - ${req.method} request for ${req.url}`);
    next(); // pass control to the next handler which will respond by serving any static files we've placed in the directory called static
});

app.use(express.static("../static")); //middleware functions


// lastly we call app.listen to specify what port express should listen on
app.listen(81, function() {
    console.log("Serving static on 81");
});

// Now we have node & express setup to be able to serve our models & host our tensorflow apps that we will be developing