const { Sequelize } = require("sequelize");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { DATABASE_URL, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

let sequelize;

if (DATABASE_URL) {
  // ✅ Using single connection string (Supabase / Railway / Render)
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl:
        process.env.DB_SSL === "false"
          ? false
          : {
            require: true,
            rejectUnauthorized: false,
          },
    },
  });

  console.log("✅ Using DATABASE_URL");
} else {
  // ✅ Local PostgreSQL configuration
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST || "localhost",
    port: DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
  });

  console.log("✅ Using Local DB Config");
}

module.exports = sequelize;
