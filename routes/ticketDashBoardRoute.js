const express = require('express');
const ticketDashBoardRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();
const authAdminMiddleWare = require('../middleWare/authAdminMiddleWare')

ticketDashBoardRoute.get('/', authAdminMiddleWare,  (req, res)=> {
    const sql = `
    SELECT 
        t.*, 
        el.locatId
    FROM 
        tickets t
    LEFT JOIN 
        eventlocat el ON t.eventId = el.eventId
    ORDER BY 
        t.id DESC
`;
    connect.query(sql, (err, result)=>{
      if (err) return res.json(err);
      return res.status(200).json(result);
    })
})

ticketDashBoardRoute.get('/ticket', authAdminMiddleWare,  (req, res)=> {
    const ticketId = req.query.ticketId;
    const sql = "SELECT * FROM tickets WHERE id=?"
    connect.query(sql, [ticketId], (err, result)=>{
      if (err) return res.json(err);
      return res.status(200).json(result[0]);
    })
})

ticketDashBoardRoute.post('/', authAdminMiddleWare, (req, res)=> {
    const { eventId, date, time, categoriesId, total, price } = req.body; 
    if (!eventId) {
        return res.status(400).json({ message: 'All fields are required.'});
    }
    
    const sql = "INSERT INTO tickets (eventId, date, time, ticketCategoriesId, total, price) VALUES (?, ?, ?, ?, ?, ?)"
    connect.query(sql, [ eventId, date, time, categoriesId, total, price ], (err, result)=>{
        const ticketId = result.insertId; 
        if (err) return res.json(err);
        return res.status(201).json({ message: 'Ticke created successfully.', result, ticketId});
    })
})

ticketDashBoardRoute.get('/categories', authAdminMiddleWare, (req, res) => {
  const sql = "SELECT * FROM ticket_categories";
  connect.query(sql, (err, result) => {
      if (err) return res.json(err);
      return res.status(200).json(result);
  });
});

// Обновление билета
ticketDashBoardRoute.put('/', authAdminMiddleWare, (req, res) => {
    const { eventId, price, total, date, time, ticketCategoriesId, id } = req.body;
  
    if (!id) {
        return res.status(400).json({ message: 'id билета обязательно.' });
    }
    //Обновляем
    const sqlUpdateTicket = "UPDATE tickets SET eventId = ?, price=?, total=?, date=?, time=?, ticketCategoriesId=? WHERE id = ?";
    connect.query(sqlUpdateTicket, [eventId, price, total, date, time, ticketCategoriesId, id], (err, result) => {
        if (err) return res.json(err);
  
        // Проверка, было ли обновлено что-то
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Билет не найден.' });
        }
        else {
            const updatedTicket = {
                id: id,
                eventId: eventId,	
                price: price, 
                total: total, 
                date: date, 
                time: time,
                ticketCategoriesId: ticketCategoriesId
                 
            };
            return res.status(200).json({ message: 'Билет успешно обновлен.', updatedTicket });
        }
    });
  });

ticketDashBoardRoute.delete('/', authAdminMiddleWare, (req, res) => { 
  const { id } = req.body;
  if (!id) {
      return res.status(400).json({ message: 'ID обязателен.' });
  }
  const sqlDelete = "DELETE FROM tickets WHERE id = ?";
  connect.query(sqlDelete, [id], (err, result) => {
      if (err) {
          return res.status(500).json({ message: 'Ошибка при удалении билета', error: err });
      }
      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Билет не найден.' });
      } else {
          return res.status(200).json({ message: 'Билет успешно удален!', id });
      }
  });
});

module.exports = ticketDashBoardRoute;