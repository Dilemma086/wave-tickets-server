const express = require('express');
const categDashBoardRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();
const authAdminMiddleWare = require('./../middleWare/authAdminMiddleWare')

categDashBoardRoute.get('/', authAdminMiddleWare,  (req, res)=> {
    const sql = "SELECT * FROM category"
    connect.query(sql, (err, result)=>{
      if (err) return res.json(err);
      return res.json(result);
    })
})

categDashBoardRoute.post('/', authAdminMiddleWare, (req, res)=> {
    const { Name } = req.body; 
    if (!Name) {
        return res.status(400).json({ message: 'Category name is required.' });
    }
    const sql = "INSERT INTO category (Name) VALUES (?)"
    connect.query(sql, [Name], (err, result)=>{
      if (err) return res.json(err);
      return res.status(201).json({ message: 'Category created successfully.', categoryId: result.insertId });
    })
})

module.exports = categDashBoardRoute;