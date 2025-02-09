const express = require('express');
const orderDashBoardRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();
const authAdminMiddleWare = require('../middleWare/authAdminMiddleWare')

orderDashBoardRoute.get('/', authAdminMiddleWare,  (req, res)=> {
    const sql = "SELECT * FROM orders"
    connect.query(sql, (err, result)=>{
      if (err) return res.json(err);
      return res.json(result);
    })
})

orderDashBoardRoute.get('/:id', authAdminMiddleWare,  (req, res)=> {
  const id = req.params.id
  const sql = "SELECT * FROM orders WHERE id=?"
  connect.query(sql, [id], (err, result)=>{
    if (err) return res.json(err);
    return res.json(result);
  })
})

orderDashBoardRoute.post('/:id', authAdminMiddleWare, (req, res)=> {
    const { UserID, TicketID, Status, TicketDoc } = req.body; 
    const id = req.params.id; // Извлечение id из параметров URL

    // Проверка на наличие обязательных полей
    if (!UserID || !TicketID || !Status || !TicketDoc) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const sql = "UPDATE orders SET UserID = ?, TicketID = ?, Status = ?, TicketDoc = ? WHERE id = ?";
    connect.query(sql, [UserID, TicketID, Status, TicketDoc, id], (err, result) => {
        if (err) {
            console.error(err); // Логирование ошибки на сервере
            return res.status(500).json({ message: 'Error updating order.', error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found.' }); // Обработка случая, когда заказ не найден
        }

        return res.status(200).json({ message: 'Order updated successfully.', result });
    });
})

module.exports = orderDashBoardRoute;