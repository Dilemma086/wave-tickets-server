const express = require('express');
const locatRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();

locatRoute.get('/', (req, res)=> {
    const sql = "SELECT * FROM locations"
    connect.query(sql, (err, result)=>{
      if (err) return res.json(err);
      return res.json(result);
    })
})
locatRoute.get('/:id', (req, res)=> {
    const id = req.params.id;
    const sql = "SELECT * FROM locations WHERE id=?"
    connect.query(sql, [id], (err, result)=>{
      if (err) return res.json(err);
      return res.json(result);
    })
})

module.exports = locatRoute;