const express = require('express');
const searchRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();

searchRoute.get('/:date/:location', (req, res) => {
    const date = req.params.date;
    const location = req.params.location;
    if(date !== 'null' && location !== 'null'){
        const sql = `        
                SELECT 
                l.*, 
                t.*,
                e.*,
                tc.*,
                e.name AS eventName,
                tc.name AS category,
                l.name AS locatName, 
                i.image AS firstImageUrl,
                t.date AS ticketDate,
                t.time AS ticketTime
            FROM 
                locations l
            JOIN 
                eventlocat el ON l.id = el.locatId
            JOIN 
                tickets t ON el.eventId = t.eventId
            JOIN 
                events e ON t.eventId = e.id
            JOIN 
                ticket_categories tc ON t.ticketCategoriesId = tc.id
            LEFT JOIN (
                SELECT 
                    ei.eventId,
                    MIN(ei.imageId) AS firstImageId
                FROM 
                    eventimage ei
                GROUP BY 
                    ei.eventId
            ) AS ei ON el.eventId = ei.eventId
            LEFT JOIN images i ON ei.firstImageId = i.id
            WHERE 
                l.name = ?
            GROUP BY 
                e.id
        
        `
        connect.query(sql, [location], (err, result) => {
            if (err) return res.json(err);
            return res.json(result);
        })
    }
    else if (date !== 'null') {
        
        const sql = `SELECT 
        t.*, 
        e.*, 
        e.name AS eventName, 
        i.image AS firstImageUrl,
        t.date AS ticketDate,
        t.time AS ticketTime
    FROM 
        events e
    JOIN (
        SELECT 
            t.eventId, 
            MIN(t.price) AS minPrice
        FROM 
            tickets t
        WHERE 
            t.date = ?
        GROUP BY 
            t.eventId
    ) AS minTickets ON e.id = minTickets.eventId
    JOIN tickets t ON t.eventId = minTickets.eventId AND t.price = minTickets.minPrice
    LEFT JOIN images i ON i.id = (
        SELECT MIN(imageId)
        FROM eventimage
        WHERE eventId = e.id
    )
    `
        connect.query(sql, [date], (err, result) => {
            if (err) return res.json(err);
            return res.json(result);
        })
    }
    else if (location !== 'null') {

        const sql = `        
                SELECT 
                l.*, 
                t.*,
                e.*,
                tc.*,
                e.name AS eventName,
                tc.name AS category,
                l.name AS locatName, 
                i.image AS firstImageUrl,
                t.date AS ticketDate,
                t.time AS ticketTime
            FROM 
                locations l
            JOIN 
                eventlocat el ON l.id = el.locatId
            JOIN 
                tickets t ON el.eventId = t.eventId
            JOIN 
                events e ON t.eventId = e.id
            JOIN 
                ticket_categories tc ON t.ticketCategoriesId = tc.id
            LEFT JOIN (
                SELECT 
                    ei.eventId,
                    MIN(ei.imageId) AS firstImageId
                FROM 
                    eventimage ei
                GROUP BY 
                    ei.eventId
            ) AS ei ON el.eventId = ei.eventId
            LEFT JOIN images i ON ei.firstImageId = i.id
            WHERE 
                l.name = ?
            GROUP BY 
                e.id
        
        `
        connect.query(sql, [location], (err, result) => {
            if (err) return res.json(err);
            return res.json(result);
        })
    }


});

module.exports = searchRoute;