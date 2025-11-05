const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//==============================ROUTES SECTION======================================================
const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);
const categoryRoutes = require("./routes/category.routes");
app.use("/api/categories", categoryRoutes);
const productRoutes = require("./routes/product.routes");
app.use("/api/products", productRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err.message);
    console.error(err.stack);

    return res.status(500).json({
        message: "Something went wrong. Please try again later."
    });
});

app.get("/", (req, res) => {
    res.send("Inventory System API Running");
});

// DB Connection & Server Start
sequelize.authenticate()
    .then(() => {
        console.log("Database Connected Successfully");
        return sequelize.sync();
    })
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`Server running on http://localhost:${process.env.PORT}`);
        });
    })
    .catch((error) => console.log("DB Connection Error:", error));