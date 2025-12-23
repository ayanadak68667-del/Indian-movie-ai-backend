const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ROUTES
const movieRoutes = require("./routes/Movie"); // ⚠️ Capital M match কর
const homeRoutes = require("./routes/home");

app.use("/api", movieRoutes);
app.use("/api", homeRoutes);

// ROOT
app.get("/", (req, res) => {
  res.send("Indian Movie AI Backend Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
