const express = require('express');
const calendarRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();


calendarRoute.get('/:date', (req, res)=> {
    const date = req.params.date;
    const sql = "SELECT * FROM calendar WHERE Date=?"
    connect.query(sql, [date], (err, result)=>{
      if (err) return res.json(err);
      return res.json(result);
    })
})

module.exports = calendarRoute;