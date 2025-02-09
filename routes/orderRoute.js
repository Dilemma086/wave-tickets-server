const express = require('express');
const orderRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();
const authMiddleware = require('./../middleWare/authMiddleware')

orderRoute.get('/', authMiddleware, (req, res) => {
        
    const sql = `
        SELECT 
            o.*, 
            t.*, 
            e.*, 
            el.*,
            u.*,
            u.id AS user_Id,
            l.name AS location_name, 
            tc.name AS category_name, 
            i.image AS image_url, 
            o.id AS orderId
        FROM orders o
        JOIN users u ON o.userId = u.id
        JOIN tickets t ON o.ticketId = t.id
        JOIN events e ON t.eventId = e.id
        JOIN eventlocat el ON e.id = el.eventId
        JOIN locations l ON el.locatId = l.id
        JOIN ticket_categories tc ON t.ticketCategoriesId = tc.id
        LEFT JOIN images i ON i.id = (
            SELECT MIN(imageId)
            FROM eventimage
            WHERE eventId = e.id
        )
        ORDER BY o.id DESC`;  // Сортировка по orderId (o.id) по убыванию
  
    connect.query(sql, (err, result) => {
        if (err) return res.json(err);
        return res.json(result);
    });
});


orderRoute.get('/:id', authMiddleware, (req, res) => {
    const userId = req.params.id; 
    
    const sql = `
        SELECT o.*, t.*, e.*, el.*, l.name AS location_name, tc.name AS category_name, i.image AS image_url, o.id AS orderId
        FROM orders o
        JOIN tickets t ON o.ticketId = t.id
        JOIN events e ON t.eventId = e.id
        JOIN eventlocat el ON e.id = el.eventId
        JOIN locations l ON el.locatId = l.id
        JOIN ticket_categories tc ON t.ticketCategoriesId = tc.id
        LEFT JOIN images i ON i.id = (
            SELECT MIN(imageId)
            FROM eventimage
            WHERE eventId = e.id
        )
        WHERE o.userId = ?
        ORDER BY o.id DESC`;  // Сортировка по orderId (o.id) по убыванию
  
    connect.query(sql, [userId], (err, result) => {
        if (err) return res.json(err);
        return res.json(result);
    });
});

orderRoute.get('/:userId/:orderId', authMiddleware, (req, res) => {
    const userId = req.params.userId; 
    const orderId = req.params.orderId; 
    
    const sql = `
            SELECT o.*, t.*, e.*, el.*, l.name AS location_name, tc.name AS category_name, i.image AS image_url, o.id AS orderId
            FROM orders o
            JOIN tickets t ON o.ticketId = t.id
            JOIN events e ON t.eventId = e.id
            JOIN eventlocat el ON e.id = el.eventId
            JOIN locations l ON el.locatId = l.id
            JOIN ticket_categories tc ON t.ticketCategoriesId = tc.id
            LEFT JOIN images i ON i.id = (
                SELECT MIN(imageId)
                FROM eventimage
                WHERE eventId = e.id
            ) 
        WHERE o.id = ? AND o.userId = ? 
        `; 
  
    connect.query(sql, [orderId, userId], (err, result) => {
        if (err) return res.json(err);
        return res.json(result);
    });
});

orderRoute.put('/', authMiddleware, (req, res) => {
    const { orderId, newStatus, quantity } = req.body;

    // Начинаем транзакцию
    connect.beginTransaction((err) => {
        if (err) return res.json(err);

        // Обновляем таблицу orders
        const updateOrderSql = `UPDATE orders SET status = ?, isread = 1 WHERE id = ?`;
        connect.query(updateOrderSql, [newStatus, orderId], (err, result) => {
            if (err) {
                return connect.rollback(() => {
                    return res.json(err);
                });
            }

            // Если newStatus равен 'Принят', обновляем таблицу tickets
            if (newStatus === 'Принят') {
                // Получаем ticketId из таблицы orders
                const getTicketIdSql = `SELECT ticketId FROM orders WHERE id = ?`;
                connect.query(getTicketIdSql, [orderId], (err, ticketResult) => {
                    if (err) {
                        return connect.rollback(() => {
                            return res.json(err);
                        });
                    }

                    // Проверяем, нашли ли мы ticketId
                    if (ticketResult.length === 0) {
                        return connect.rollback(() => {
                            return res.json({ error: 'Ticket not found for the given orderId' });
                        });
                    }

                    const ticketId = ticketResult[0].ticketId;

                    // Обновляем таблицу tickets
                    const updateTicketsSql = `UPDATE tickets SET total = total - ? WHERE id = ?`;
                    connect.query(updateTicketsSql, [quantity, ticketId], (err, result) => {
                        if (err) {
                            return connect.rollback(() => {
                                return res.json(err);
                            });
                        }

                        // Коммитим транзакцию
                        connect.commit((err) => {
                            if (err) {
                                return connect.rollback(() => {
                                    return res.json(err);
                                });
                            }
                            return res.json(result);
                        });
                    });
                });
            } else {
                // Если newStatus не 'Принят', просто коммитим транзакцию
                connect.commit((err) => {
                    if (err) {
                        return connect.rollback(() => {
                            return res.json(err);
                        });
                    }
                    return res.json(result);
                });
            }
        });
    });
});


orderRoute.post('/', authMiddleware, (req, res) => {
  
  const { userId } = req.body; 
  const { tickets } = req.body; 

  if (!tickets || tickets.length === 0) {
      return res.status(400).json({ error: 'Tickets are required to create an order.' });
  }

  const sql = "INSERT INTO orders (userId, ticketId,	quantity,	status,	isread) VALUES ?";
  const values = tickets.map(ticket => [userId, ticket.id, ticket.quantity, 'В обработке', false]);

  connect.query(sql, [values], (err, result) => {
      if (err) {
          console.error('Ошибка при создании заказа:', err);
          return res.status(500).json({ error: 'Ошибка при создании заказа' });
      }
      return res.status(201).json({ message: 'Orders created successfully.', orderIds: result.insertId });
  });
});

// Создаем маршрут для обновления заказа
orderRoute.put('/:orderId', authMiddleware, (req, res) => {
  const userId = req.userId; // Получаем ID пользователя из middleware
  const orderId = req.params.orderId; // Получаем ID заказа из параметров URL
  const { TicketID, Status, TicketDoc } = req.body; // Получаем данные из тела запроса

  // Проверка на наличие хотя бы одного поля для обновления
  if (!TicketID && Status === undefined && !TicketDoc) {
      return res.status(400).json({ message: 'At least one field is required to update: TicketID, Status, TicketDoc.' });
  }

  // Создаем массив для обновления
  const updates = [];
  const values = [];

  // Добавляем поля для обновления
  if (TicketID) {
      updates.push('TicketID = ?');
      values.push(TicketID);
  }
  if (Status !== undefined) {
      updates.push('Status = ?');
      values.push(Status);
  }
  if (TicketDoc) {
      updates.push('TicketDoc = ?');
      values.push(TicketDoc);
  }

  // Добавляем ID заказа и ID пользователя в массив значений
  values.push(orderId, userId);

  // Формируем SQL-запрос
  const sql = `UPDATE orders SET ${updates.join(', ')} WHERE OrderID = ? AND UserID = ?`;

  connect.query(sql, values, (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Order not found or you do not have permission to update this order.' });
      }
      return res.json({ message: 'Order updated successfully.' });
  });
});


module.exports = orderRoute;