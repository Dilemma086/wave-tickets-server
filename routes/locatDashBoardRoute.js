const express = require('express');
const multer = require('multer');
const path = require('path');
const locatDashBoardRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();
const authAdminMiddleWare = require('../middleWare/authAdminMiddleWare');


// Настройка хранения файлов с помощью multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.resolve(__dirname, '../uploads');
        cb(null, uploadsDir);
        
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Переименование файла
    }
});
const upload = multer({ storage: storage });

// GET маршрут для получения локаций
locatDashBoardRoute.get('/', authAdminMiddleWare, (req, res) => {
    const sql = `
        SELECT l.*, i.image AS image
        FROM locations l
        LEFT JOIN locatimage li ON l.id = li.locatId
        LEFT JOIN images i ON li.imageId = i.id 
        ORDER BY l.id ASC
    `;
    connect.query(sql, (err, result) => {
        if (err) return res.json(err);
        return res.json(result);
    });
});

// POST маршрут для создания локации с изображением
locatDashBoardRoute.post('/', authAdminMiddleWare, upload.single('image'), (req, res) => {
    const { name, description, street, dom, metro, map } = req.body; 

    const image = req.file ? `/uploads/${req.file.filename}` : null; // Изменено здесь // Получаем путь к загруженному изображению
    
    if (!name) {
        return res.status(400).json({ message: 'Location name is required.' });
    }

    // Шаг 1: Вставка новой локации
    const sqlInsertLocation = "INSERT INTO locations (name, description, street, dom, metro, map) VALUES (?,?,?,?,?,?)";
    connect.query(sqlInsertLocation, [name, description, street, dom, metro, map], (err, result) => {
        if (err) return res.json(err);

        const locatId = result.insertId; // Получаем ID новой локации
        
        // Шаг 2: Вставка изображения
        if (image) {
            const sqlInsertImage = "INSERT INTO images (image) VALUES (?)"; // Предполагается, что у вас есть таблица images
            connect.query(sqlInsertImage, [image], (err, imageResult) => {
                if (err) return res.json(err);

                const imageId = imageResult.insertId; // Получаем ID нового изображения
                
                // Шаг 3: Добавление записи в связующую таблицу
                const sqlInsertLocatImage = "INSERT INTO locatimage (locatId, imageId) VALUES (?, ?)";
                connect.query(sqlInsertLocatImage, [locatId, imageId], (err) => {
                    if (err) return res.json(err);

                    return res.status(201).json({ message: 'Location created successfully with image.', locatId, imageId });
                });
            });
        } else {
            return res.status(400).json({ message: 'Image is required.' });
        }
    });
});

// PUT маршрут для изменения локации с изображением
locatDashBoardRoute.put('/', authAdminMiddleWare, upload.single('image'), (req, res) => {
    const { name, description, street, dom, metro, map, id } = req.body;

    const image = req.file ? `/uploads/${req.file.filename}` : null; // Получаем путь к загруженному изображению

    if (!name) {
        return res.status(400).json({ message: 'Название локации обязательно.' });
    }

    // Шаг 1: Обновление информации о локации
    const sqlUpdateLocation = "UPDATE locations SET name = ?, description = ?, street = ?, dom = ?, metro = ?, map =? WHERE id = ?";
    connect.query(sqlUpdateLocation, [name, description, street, dom, metro, map, id], (err, result) => {
        if (err) return res.json(err);

        // Проверка, было ли обновлено что-то
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Локация не найдена.' });
        }

        // Объект для хранения обновленной информации о локации
        const updatedLocation = {
            id: id,
            name: name,
            description: description,
            street: street,
            dom: dom,
            metro: metro,
            map: map,
            image: image // Добавляем путь к изображению
        };

        // Шаг 2: Обновление изображения, если было загружено новое
        if (image) {
            const sqlInsertImage = "INSERT INTO images (image) VALUES (?)"; 
            connect.query(sqlInsertImage, [image], (err, imageResult) => {
                if (err) return res.json(err);

                const imageId = imageResult.insertId; // Получаем ID нового изображения
                
                // Шаг 3: Добавление записи в связующую таблицу
                const sqlInsertLocatImage = "INSERT INTO locatimage (locatId, imageId) VALUES (?, ?)";
                connect.query(sqlInsertLocatImage, [id, imageId], (err) => {
                    if (err) return res.json(err);

                    // Возвращаем обновленную информацию о локации
                    return res.status(201).json({ message: 'Локация успешно обновлена с изображением.', updatedLocation });
                });
            });
        } else {
            // Если изображение не было загружено, возвращаем обновленную информацию о локации
            return res.status(200).json({ message: 'Локация успешно обновлена без нового изображения.', updatedLocation });
        }
    });
});

locatDashBoardRoute.delete('/', authAdminMiddleWare, (req, res) => { 
    const { id } = req.body;

    // Проверяем, что ID был предоставлен
    if (!id) {
        return res.status(400).json({ message: 'ID обязателен.' });
    }

    const sqlDeleteLocation = "DELETE FROM locations WHERE id = ?";
    
    connect.query(sqlDeleteLocation, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Ошибка при удалении локации', error: err });
        }

        // Проверяем, были ли затронуты какие-либо строки
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Локация не найдена.' });
        } else {
            return res.status(200).json({ message: 'Локация успешно удалена!' });
        }
    });
});


module.exports = locatDashBoardRoute;