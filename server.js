// We are writing dotenv on the top so that we can access it in whole file, because of this we are able to write process.env.PORT
require("dotenv").config({path : "./config.env"});

const express = require('express');
const connectDB = require('./config/db');
// importing error handler from middleware folder to handle all the errors
const errorHandler = require('./middleware/error');

// connectDB
connectDB()
    .then(() => console.log("Connected to database"))
    .catch(error => console.log(`Error while connecting ${error.message}`))

const app = express();

app.use(express.json());

// if there is any request with route name => /api/auth , it will redirect it to auth file in routes folder
app.use('/api/auth', require('./routes/auth'));
app.use('/api/private', require('./routes/private'));

// Error handler ( SHOULD BE LAST PIECE OF MIDDLEWARE )
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// this is to handle the cases, when there is some unhandeled error, which can lead to crashing of server. It will not let it happen 
process.on("unhandledRejection", (error, promise) => {
    console.log(`logged error: ${error}`);
    server.close(() => process.exit(1));
})