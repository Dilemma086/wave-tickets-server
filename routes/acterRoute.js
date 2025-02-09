const express = require('express');
const acterRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();

acterRoute.get('/', (req, res)=> {
    const sql = "SELECT * FROM acters"
    connect.query(sql, (err, result)=>{
      if (err) return res.json(err);
      return res.json(result);
    })
})
acterRoute.get('/:id', (req, res)=> {
    const id = req.params.id;
    const sql = "SELECT * FROM acters WHERE id=?"
    connect.query(sql, [id], (err, result)=>{
      if (err) return res.json(err);
      return res.json(result);
    })
})

module.exports = acterRoute;