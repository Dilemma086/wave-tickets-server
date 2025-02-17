const express = require('express');
const ticketRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();

// Маршрут для получения всех билетов
ticketRoute.get('/', (req, res) => {
  const sql = `
  SELECT 
  t.*, 
  el.locatId,
  GROUP_CONCAT(ei.imageId) AS imageIds,
  i.image AS firstImageUrl
FROM 
  tickets t
LEFT JOIN 
  eventlocat el ON t.eventId = el.eventId
LEFT JOIN 
  eventimage ei ON t.eventId = ei.eventId
LEFT JOIN 
  (SELECT eventId, MIN(imageId) AS minImageId 
   FROM eventimage 
   GROUP BY eventId) ei_min ON t.eventId = ei_min.eventId
LEFT JOIN 
  images i ON ei_min.minImageId = i.id
GROUP BY 
  t.id, el.locatId
ORDER BY 
  t.id DESC
  `;

  connect.query(sql, (err, result) => {
    if (err) {
      console.error('Ошибка выполнения запроса:', err);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
    return res.json(result);
  });
});

// Маршрут для получения билета по идентификатору
ticketRoute.get('/:id', (req, res) => {
  const sql = `
    SELECT 
        t.*, 
        el.locatId,
        GROUP_CONCAT(ei.imageId) AS imageIds,
        i.image AS firstImageUrl,
        e.name AS eventName,  
        l.id AS locationId,    
        l.name AS locationName,
        l.description AS locationDescription, 
        l.street AS locationStreet, 
        l.dom AS locationDom, 
        l.metro AS locationMetro, 
        l.map AS locationMap,   
        tc.name AS categoryName    
    FROM 
        tickets t
    LEFT JOIN 
        eventlocat el ON t.eventId = el.eventId
    LEFT JOIN 
        eventimage ei ON t.eventId = ei.eventId
    LEFT JOIN 
        (SELECT eventId, MIN(imageId) AS minImageId 
         FROM eventimage 
         GROUP BY eventId) ei_min ON t.eventId = ei_min.eventId
    LEFT JOIN 
        images i ON ei_min.minImageId = i.id
    LEFT JOIN 
        events e ON t.eventId = e.id  -- Соединяем с таблицей events
    LEFT JOIN 
        locations l ON el.locatId = l.id  -- Соединяем с таблицей locations
    LEFT JOIN 
        ticket_categories tc ON t.ticketCategoriesId = tc.id  -- Соединяем с таблицей ticket_categories
    WHERE 
        t.id = ?
    GROUP BY 
        t.id, el.locatId
    ORDER BY 
        t.id DESC
  `;

  connect.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error('Ошибка выполнения запроса:', err);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Билет не найден' });
    }

    // Формируем ответ
    const ticket = result[0];
    const response = {
      id: ticket.id,
      price: ticket.price,               
      total: ticket.total,               
      row: ticket.row,                   
      seats: ticket.seats,               
      sector: ticket.sector,             
      date: ticket.date,                
      time: ticket.time,                 
      eventId: ticket.eventId,
      images: ticket.imageIds ? ticket.imageIds.split(',') : [],
      firstImageUrl: ticket.firstImageUrl,
      eventName: ticket.eventName,
      location: {
        id: ticket.locationId,
        name: ticket.locationName,
        description: ticket.locationDescription,
        street: ticket.locationStreet,
        dom: ticket.locationDom,
        metro: ticket.locationMetro,
        map: ticket.locationMap,
      },
      categoryName: ticket.categoryName  
    };

    return res.json(response);
  });
});



module.exports = ticketRoute;