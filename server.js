require("dotenv").config({ path: "./config.env" });
const app = require("./app");
const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
  console.log("Error: Uncaught Exception");
  console.log(err);
  console.log("SHUTTING DOWN!!!");
  process.exit();
});

let port = process.env.PORT || 3000;
let DB = process.env.DB_CONNECTION_STRING.replace(
  "<db_password>",
  process.env.DB_PASSWORD
);

mongoose.connect(DB).then(() => console.log("DB connection successful"));

const server = app.listen(port, () => {
  console.log(`server started on port: ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log("Error: Unhandled Rejection");
  console.log(err);
  console.log("SHUTTING DOWN!!!");
  server.close();
  process.exit();
});

process.on("SIGTERM", (err) => {
  console.log("Error: SiGTERM Recieved, Shutting down...");
  server.close();
  process.exit();
});
