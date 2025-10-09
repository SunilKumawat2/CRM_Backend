const dbconnection = require("./config/DbConnection");
const cors = require("cors");
const express = require("express");
const path = require("path");
const ApiRouter = require("./routes/ApiRoutes");

//<------------- Middleware ----------->
const app = express();
app.use(express.json());
app.use(cors());

// ✅ Serve static files for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const port = 4005;

// Middleware for the routes 
app.use("/crm/api", ApiRouter);

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

console.log("hello this is CRM server");
