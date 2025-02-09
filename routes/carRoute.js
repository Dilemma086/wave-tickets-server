const express = require('express');
const carRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();
const authMiddleware = require('./../middleWare/authMiddleware')

carRoute.get('/', authMiddleware,  (req, res)=> {
    const id = req.userId; // Получаем ID пользователя из middleware
    const sql = "SELECT * FROM car WHERE UserId = ?"
    connect.query(sql, [id], (err, result)=>{
      if (err) return res.json(err);
      return res.json(result);
    })
})
carRoute.post('/', authMiddleware, (req, res)=> {
    const id = req.userId; 
    const { TicketID, Date } = req.body; // Получаем данные из тела запроса
    const sql = "INSERT INTO car (UserID, TicketID, Date) VALUES (?, ?, ?)";
    connect.query(sql, [userId, TicketID, Date], (err, result) => {
      if (err) return res.json(err);
      return res.json({ message: 'Car added successfully', result });
  });
})

carRoute.delete('/', authMiddleware, (req, res) => {
  const userId = req.userId; // Получаем ID пользователя из middleware
  const { TicketID, Date } = req.body; // Получаем данные из тела запроса
  // SQL-запрос для удаления данных
  const deleteSql = "DELETE FROM car WHERE UserID = ? AND TicketID = ? AND Date = ?";
  
  connect.query(deleteSql, [userId, TicketID, Date], (err) => {
      if (err) return res.json(err);
      return res.json({ message: 'Car deleted successfully.' });
  });
});

module.exports = carRoute;