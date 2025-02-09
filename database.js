const mysql = require('mysql2');

const createConnection = () => {
  return mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    database: "ticketdb",
    password: ""
  });
};

module.exports = createConnection;