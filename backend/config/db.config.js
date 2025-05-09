module.exports = {
  HOST: process.env.DB_HOST || "localhost",
  USER: process.env.DB_USER || "root",
  PASSWORD: process.env.DB_PASSWORD || "",
  DB: process.env.DB_NAME || "feedback_management",
  dialect: "mysql",
  pool: {
    max: 10,
    min: 2,
    acquire: 60000,
    idle: 20000
  },
  dialectOptions: {
    connectTimeout: 60000,
    options: {
      requestTimeout: 60000
    }
  },
  logging: process.env.NODE_ENV !== 'production' ? console.log : false
};