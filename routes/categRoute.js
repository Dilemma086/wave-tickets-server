const express = require('express');
const categRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();

categRoute.get('/:category', (req, res)=> {
    const category = req.params.category;
    
    const sql = `SELECT 
    MIN(c.id) AS categoryId,
    MIN(c.name) AS categoryName,
    ec.eventId,
    MIN(t.date) AS ticketDate,
    MIN(t.time) AS ticketTime,
    MIN(t.price) AS price,
    MIN(t.total) AS total,
    MIN(e.name) AS eventName,
    MIN(i.image) AS firstImageUrl
FROM 
    category c
JOIN
    eventcategory ec ON c.id = ec.categoryId
JOIN
    tickets t ON ec.eventId = t.eventId
JOIN
    events e ON ec.eventId = e.id
LEFT JOIN (
    SELECT 
        ei.eventId,
        MIN(ei.imageId) AS firstImageId
    FROM 
        eventimage ei
    GROUP BY 
        ei.eventId
) AS ei ON ec.eventId = ei.eventId
LEFT JOIN 
    images i ON ei.firstImageId = i.id
WHERE 
    url=?
GROUP BY 
    ec.eventId;`
    connect.query(sql, [category], (err, result)=>{
      if (err) return res.json(err);
      return res.json(result);
    })
})

module.exports = categRoute;