const express = require('express');
const mainRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();

mainRoute.get('/', (req, res)=> {
  return res.json('Все Ок')
})

module.exports = mainRoute;