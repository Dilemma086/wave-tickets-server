const express = require('express');
const multer = require('multer');
const path = require('path');
const eventDashBoardRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();
const authAdminMiddleWare = require('../middleWare/authAdminMiddleWare')

eventDashBoardRoute.get('/', authAdminMiddleWare, (req, res) => {
    const sql = `
        SELECT 
            e.id AS Id,
            e.name AS name,
            e.description AS description,
            e.date AS date,
            e.time AS time,
            GROUP_CONCAT(DISTINCT i.image) AS images, 
            GROUP_CONCAT(DISTINCT c.id) AS category,
            GROUP_CONCAT(DISTINCT a.id) AS acters, 
            GROUP_CONCAT(DISTINCT l.id) AS locations
            
        FROM events e
            LEFT JOIN eventimage ei ON e.id = ei.eventId
            LEFT JOIN images i ON ei.imageId = i.id 
            LEFT JOIN eventcategory ec ON e.id = ec.eventId
            LEFT JOIN category c ON ec.categoryId = c.id
            LEFT JOIN eventacter ea ON e.id = ea.eventId
            LEFT JOIN acters a ON ea.acterId = a.id 
            LEFT JOIN eventlocat el ON e.id = el.eventId
            LEFT JOIN locations l ON el.locatId = l.id 
           
        GROUP BY e.id
        ORDER BY e.id ASC
    `;
    connect.query(sql, (err, result) => {
        if (err) {console.log('Ошибка:',err) 
            return res.json(err);
        }
        return res.json(result);
    });
});
//Получение одного мероприятия по eventId
eventDashBoardRoute.get('/event', authAdminMiddleWare, (req, res) => {
    const eventId = req.query.eventId;

    if (!eventId) {
        return res.status(400).json({ error: 'Параметр eventId не указан' });
    }
    const sql = `
        SELECT 
            e.id AS Id,
            e.name AS name,
            e.description AS description,
            e.date AS date,
            e.time AS time,
            GROUP_CONCAT(DISTINCT i.image) AS images, 
            GROUP_CONCAT(DISTINCT c.id) AS category,
            GROUP_CONCAT(DISTINCT a.id) AS acters, 
            GROUP_CONCAT(DISTINCT l.id) AS locations
            
        FROM events e
            LEFT JOIN eventimage ei ON e.id = ei.eventId
            LEFT JOIN images i ON ei.imageId = i.id 
            LEFT JOIN eventcategory ec ON e.id = ec.eventId
            LEFT JOIN category c ON ec.categoryId = c.id
            LEFT JOIN eventacter ea ON e.id = ea.eventId
            LEFT JOIN acters a ON ea.acterId = a.id 
            LEFT JOIN eventlocat el ON e.id = el.eventId
            LEFT JOIN locations l ON el.locatId = l.id 
           
        WHERE e.id = ?
        GROUP BY e.id
    `;

    connect.query(sql, [eventId], (err, result) => {
        if (err) {
            console.log('Ошибка:', err);
            return res.status(500).json({ error: err.message });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Мероприятие не найдено' });
        }
       
        return res.json(result[0]);
    });
});


// Настройка хранения файлов с помощью multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.resolve(__dirname, '../uploads');
        cb(null, uploadsDir);
        
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
  });
const upload = multer({ storage: storage });

//Загрузка изображения в уже существующее мероприятие, когда известен eventId
eventDashBoardRoute.post('/uploadImage', authAdminMiddleWare, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded.' });
    }
    const { eventId } = req.body;
    const imagePath = `/uploads/${req.file.filename}`;

    // Сохранение пути к изображению в базе данных (если необходимо)
    const sqlInsertImage = "INSERT INTO images (image) VALUES (?)";
    connect.query(sqlInsertImage, [imagePath], (err, imageResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'An error occurred while saving the image.' });
        }

        const imageId = imageResult.insertId; // Получаем ID нового изображения
        const sqlInsertEventImage = "INSERT INTO eventimage (eventId, imageId) VALUES (?, ?)";
            
                connect.query(sqlInsertEventImage, [eventId, imageId], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'An error occurred while linking the images to the event.' });
                    }
                });
            
        // Возвращаем путь к изображению и его ID
        res.status(201).json({imagePath});
    });
});

//Загрузка изображения при неизвестном мероприятии, когда оно еще не создано, т.е. нет eventId. Загражжаем данные на сервер и возвращаем клиенту id изображения(ий)
eventDashBoardRoute.post('/newloadImage', authAdminMiddleWare, upload.array('images'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No images uploaded.' });
    }

    const imageIds = [];

    req.files.forEach(file => {
        const imagePath = `/uploads/${file.filename}`;

        const sqlInsertImage = "INSERT INTO images (image) VALUES (?)";
        connect.query(sqlInsertImage, [imagePath], (err, imageResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'An error occurred while saving the image.' });
            }
            const imageId = imageResult.insertId;
            imageIds.push(imageId);

            // Проверяем, все ли файлы обработаны
            if (imageIds.length === req.files.length) {
                res.status(201).json({ imageIds });
            }
        });
    });
});

// Удаление изображения
eventDashBoardRoute.delete('/deleteImage', authAdminMiddleWare, (req, res) => { 
    const { imageURL, eventId } = req.body;

    // Проверяем, что URL и ID события были предоставлены
    if (!imageURL || !eventId) {
        return res.status(400).json({ message: 'URL изображения и ID события обязательны.' });
    }

    // Шаг 1: Найти imageId по imageURL в таблице images
    const sqlGetImageId = "SELECT id FROM images WHERE image = ?";
    connect.query(sqlGetImageId, [imageURL], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Ошибка при поиске изображения', error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Изображение не найдено.' });
        }

        const imageId = results[0].id;
        
        // Шаг 2: Удалить запись из таблицы eventimage
        const sqlDeleteImages = "DELETE FROM eventimage WHERE imageId = ? AND eventId = ?";
        connect.query(sqlDeleteImages, [imageId, eventId], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Ошибка при удалении изображения', error: err });
            }

            // Проверяем, были ли затронуты какие-либо строки
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Изображение не найдено в связи с событием.' });
            } else {
                return res.status(200).json({ message: 'Изображение успешно удалено!' });
            }
        });
    });
});

//Добавление события
eventDashBoardRoute.post('/', authAdminMiddleWare, (req, res) => {
    const { name, description, locationId, categoryId, date, time, acters, imagesId } = req.body;
   
    const numericActors = acters.map(Number);
    const numericCategoryId = categoryId.map(Number);
    const numericLocationId = locationId.map(Number);

    if (!name) {
        return res.status(400).json({ message: 'Event name is required.' });
    }

    // Шаг 1: Вставка нового мероприятия
    const sqlInsertEvent = "INSERT INTO events (name, description, date, time) VALUES (?,?,?,?)";
    connect.query(sqlInsertEvent, [name, description, date, time], (err, eventResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'An error occurred while creating the event.' });
        }

        const eventId = eventResult.insertId; // Получаем ID нового мероприятия

        //Шаг 2: Добавление записей в связующую таблицу eventimage
        if (imagesId.length > 0) {
            const sqlInsertEventImage = "INSERT INTO eventimage (eventId, imageId) VALUES (?, ?)";
            imagesId.forEach(id => {
                connect.query(sqlInsertEventImage, [eventId, id], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'An error occurred while linking the images to the event.' });
                    }
                });
            });
        }

        // Шаг 3: Вставка актеров в связующую таблицу eventacter
        if (numericActors.length !== 0) {
            const sqlInsertEventActer = "INSERT INTO eventacter (eventId, acterId) VALUES (?, ?)";
            numericActors.forEach(acterId => {
                connect.query(sqlInsertEventActer, [eventId, acterId], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'An error occurred while linking actors to the event.' });
                    }
                });
            });
        } else {
            console.warn('No actors provided.');
        }

        // Шаг 4: Вставка локаций в связующую таблицу eventlocat
        if (numericLocationId.length !== 0) {
            const sqlInsertEventLocat = "INSERT INTO eventlocat (eventId, locatId) VALUES (?, ?)";
            numericLocationId.forEach(locatId => {
                connect.query(sqlInsertEventLocat, [eventId, locatId], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'An error occurred while linking locations to the event.' });
                    }
                });
            });
        } else {
            console.warn('No locations provided.');
        }

        // Шаг 5: Вставка категорий в связующую таблицу eventcategory
        if (numericCategoryId.length !== 0) {
            const sqlInsertEventCategory = "INSERT INTO eventcategory (eventId, categoryId) VALUES (?, ?)";
            numericCategoryId.forEach(catId => {
                connect.query(sqlInsertEventCategory, [eventId, catId], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'An error occurred while linking categories to the event.' });
                    }
                });
            });
        } else {
            console.warn('No categories provided.');
        }

        // Отправляем успешный ответ
        return res.status(201).json({ message: 'Event created successfully.', eventId });
    });
});

// Обновление мероприятия
eventDashBoardRoute.put('/', authAdminMiddleWare, upload.single('image'), (req, res) => {
  const { name,	description, locationId, categoryId, date, time, id } = req.body;

  const image = req.file ? `/uploads/${req.file.filename}` : null; // Получаем путь к загруженному изображению

  if (!name) {
      return res.status(400).json({ message: 'Название мероприятия обязательно.' });
  }
  //Обновляем
  const sqlUpdateEvent = "UPDATE events SET name = ?,	description = ?, locationId = ?, categoryId = ?, date = ?, time = ? WHERE id = ?";
  connect.query(sqlUpdateEvent, [name,	description, locationId, categoryId, date, time, id], (err, result) => {
      if (err) return res.json(err);

      // Проверка, было ли обновлено что-то
      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Мероприятие не найдено.' });
      }

      const updatedEvent = {
          id: id,
          name: name,	
          description: description, 
          locationId: locationId, 
          categoryId: categoryId, 
          date: date,
          time: time,
          image: image // Добавляем путь к изображению
      };

      // Шаг 2: Обновление изображения, если было загружено новое
      if (image) {
          const sqlInsertImage = "INSERT INTO images (image) VALUES (?)"; 
          connect.query(sqlInsertImage, [image], (err, imageResult) => {
              if (err) return res.json(err);

              const imageId = imageResult.insertId; // Получаем ID нового изображения
              
              // Шаг 3: Добавление записи в связующую таблицу
              const sqlInsertEventImage = "INSERT INTO eventimage (eventId, imageId) VALUES (?, ?)";
              connect.query(sqlInsertEventImage, [id, imageId], (err) => {
                  if (err) return res.json(err);
                  return res.status(201).json({ message: 'Мероприятие успешно обновлено с изображением.', updatedEvent });
              });
          });
      } else {
          return res.status(200).json({ message: 'Мероприятие успешно обновлено без нового изображения.', updatedEvent });
      }
  });
});

eventDashBoardRoute.delete('/', authAdminMiddleWare, (req, res) => { 
  const { id } = req.body;

  // Проверяем, что ID был предоставлен
  if (!id) {
      return res.status(400).json({ message: 'ID обязателен.' });
  }

  const sqlDeleteEvent = "DELETE FROM events WHERE id = ?";
  
  connect.query(sqlDeleteEvent, [id], (err, result) => {
      if (err) {
          return res.status(500).json({ message: 'Ошибка при удалении мероприятия', error: err });
      }

      // Проверяем, были ли затронуты какие-либо строки
      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Мероприятие не найдено.' });
      } else {
          return res.status(200).json({ message: 'Мероприятие успешно удалено!', id });
      }
  });
});

module.exports = eventDashBoardRoute;