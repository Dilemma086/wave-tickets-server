const express = require('express');
const eventRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();

eventRoute.get('/', (req, res) => {
  const sql = `
      SELECT e.*, 
             el.locatId, 
             l.name AS locationName,
             (SELECT i.image 
              FROM images i 
              WHERE i.id = (SELECT MIN(ei.imageId) 
                            FROM eventimage ei 
                            WHERE ei.eventId = e.id)
             ) AS firstImagePath,
             (SELECT MIN(t.price) 
              FROM tickets t 
              WHERE t.eventId = e.id) AS minTicketPrice
      FROM events e
      LEFT JOIN eventlocat el ON e.id = el.eventId
      LEFT JOIN locations l ON el.locatId = l.id
  `;
  
  connect.query(sql, (err, result) => {
      if (err) return res.json(err);
      return res.json(result);
  });
});


eventRoute.get('/:id', (req, res) => {
    const id = req.params.id;

    // Сначала получаем событие по ID
    const sqlEvent = "SELECT * FROM events WHERE id=?";
    connect.query(sqlEvent, [id], (err, eventResult) => {
        if (err) return res.json(err);
        if (eventResult.length === 0) return res.status(404).json({ message: 'Событие не найдено' });

        const event = eventResult[0];

        // Получаем все imageId для данного eventId из таблицы eventimage
        const sqlImages = "SELECT imageId FROM eventimage WHERE eventId=?";
        connect.query(sqlImages, [id], (err, imageResults) => {
            if (err) return res.json(err);

            const imageIds = imageResults.map(image => image.imageId);

            // Получаем адреса изображений из таблицы images
            const sqlImageAddresses = "SELECT id, image FROM images WHERE id IN (?)";
            connect.query(sqlImageAddresses, [imageIds], (err, images) => {
                if (err) return res.json(err);

                // Теперь получаем locatId для данного eventId из таблицы eventlocat
                const sqlLocations = "SELECT locatId FROM eventlocat WHERE eventId=?";
                connect.query(sqlLocations, [id], (err, locationResults) => {
                    if (err) return res.json(err);

                    const locatIds = locationResults.map(location => location.locatId);

                    // Получаем значения локаций из таблицы locations
                    const sqlLocationDetails = "SELECT id, name, street, dom, metro, map FROM locations WHERE id IN (?)";
                    connect.query(sqlLocationDetails, [locatIds], (err, locations) => {
                        if (err) return res.json(err);

                        // Получаем все билеты для данного eventId из таблицы tickets
                        const sqlTickets = "SELECT id, price, total, \`row\`, seats, sector, date, time, ticketCategoriesId FROM tickets WHERE eventId=?";
                        connect.query(sqlTickets, [id], (err, tickets) => {
                            if (err) return res.json(err);

                            // Извлекаем ticketCategoriesId и подготавливаем для запроса к ticket_categories
                            const ticketCategoriesIds = tickets.flatMap(ticket => ticket.ticketCategoriesId.split(',').map(catId => parseInt(catId.trim())));

                            // Удаляем дубликаты
                            const uniqueCategoryIds = [...new Set(ticketCategoriesIds)];

                            // Получаем названия категорий из таблицы ticket_categories
                            const sqlCategoryDetails = "SELECT id, name FROM ticket_categories WHERE id IN (?)";
                            connect.query(sqlCategoryDetails, [uniqueCategoryIds], (err, categories) => {
                                if (err) return res.json(err);

                                // Создаем объект для быстрого поиска категорий по id
                                const categoryMap = {};
                                categories.forEach(category => {
                                    categoryMap[category.id] = category;
                                });

                                // Добавляем категории к каждому билету
                                const ticketsWithCategories = tickets.map(ticket => {
                                    const categoryIds = ticket.ticketCategoriesId.split(',').map(catId => parseInt(catId.trim()));
                                    const ticketCategories = categoryIds.map(catId => categoryMap[catId]).filter(Boolean); // фильтруем, чтобы убрать неопределенные значения
                                    return { ...ticket, categories: ticketCategories };
                                });

                                // Получаем актеров для данного мероприятия
                                const sqlActors = "SELECT acterId FROM eventacter WHERE eventId=?";
                                connect.query(sqlActors, [id], (err, actorResults) => {
                                    if (err) return res.json(err);

                                    const actorIds = actorResults.map(actor => actor.acterId);

                                    // Получаем информацию об актерах из таблицы acters
                                    const sqlActorDetails = "SELECT id, fierstname, secondName, description FROM acters WHERE id IN (?)";
                                    connect.query(sqlActorDetails, [actorIds], (err, actors) => {
                                        if (err) return res.json(err);

                                        // Получаем изображения актеров
                                        const sqlActorImages = "SELECT acterId, imageId FROM acterimage WHERE acterId IN (?)";
                                        connect.query(sqlActorImages, [actorIds], (err, actorImageResults) => {
                                            if (err) return res.json(err);

                                            const actorImagesMap = {};
                                            actorImageResults.forEach(item => {
                                                if (!actorImagesMap[item.acterId]) {
                                                    actorImagesMap[item.acterId] = [];
                                                }
                                                actorImagesMap[item.acterId].push(item.imageId);
                                            });

                                            // Получаем пути изображений из таблицы images
                                            const allImageIds = [].concat(...Object.values(actorImagesMap));
                                            const sqlImageDetails = "SELECT id, image FROM images WHERE id IN (?)";
                                            connect.query(sqlImageDetails, [allImageIds], (err, imageDetails) => {
                                                if (err) return res.json(err);

                                                const imageMap = {};
                                                imageDetails.forEach(image => {
                                                    imageMap[image.id] = image.image;
                                                });

                                                // Добавляем изображения к каждому актеру
                                                const actorsWithImages = actors.map(actor => {
                                                    return {
                                                        ...actor,
                                                        images: actorImagesMap[actor.id] ? actorImagesMap[actor.id].map(imageId => imageMap[imageId]).filter(Boolean) : []
                                                    };
                                                });

                                                // Возвращаем событие с изображениями, локациями, билетами, категориями и актерами
                                                return res.json({ ...event, images, locations, tickets: ticketsWithCategories, actors: actorsWithImages });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});


module.exports = eventRoute;