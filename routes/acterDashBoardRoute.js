const express = require('express');
const multer = require('multer');
const path = require('path');
const acterDashBoardRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();
const authAdminMiddleWare = require('../middleWare/authAdminMiddleWare')


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


acterDashBoardRoute.get('/', authAdminMiddleWare,  (req, res)=> {
  const sql = `
      SELECT a.*, i.image AS image
      FROM acters a
      LEFT JOIN acterimage ai ON a.id = ai.acterId
      LEFT JOIN images i ON ai.imageId = i.id 
      ORDER BY a.id ASC
  `;
  connect.query(sql, (err, result) => {
      if (err) return res.json(err);
      return res.json(result);
  });
})

acterDashBoardRoute.get('/acter', authAdminMiddleWare,  (req, res)=> {
        const sql = `
        SELECT a.*, i.image AS image
        FROM acters a
        LEFT JOIN acterimage ai ON a.id = ai.acterId
        LEFT JOIN images i ON ai.imageId = i.id 
        ORDER BY a.id DESC
        LIMIT 1
    `;
    connect.query(sql, (err, result) => {
        if (err) return res.json({ error: err.message });
        return res.json(result[0]);
    });
});


acterDashBoardRoute.post('/', authAdminMiddleWare, upload.single('image'), (req, res) => {
  const { fierstname,	secondname,	description	 } = req.body; 

  const image = req.file ? `/uploads/${req.file.filename}` : null; // Изменено здесь // Получаем путь к загруженному изображению
  
  if (!fierstname) {
      return res.status(400).json({ message: 'Acter name is required.' });
  }

  const sqlInsertActer = "INSERT INTO acters (fierstname,	secondname,	description) VALUES (?,?,?)";
  connect.query(sqlInsertActer, [fierstname, secondname, description], (err, result) => {
      if (err) return res.json(err);

      const acterId = result.insertId; // Получаем ID новой локации
      
      // Шаг 2: Вставка изображения
      if (image) {
          const sqlInsertImage = "INSERT INTO images (image) VALUES (?)"; // Предполагается, что у вас есть таблица images
          connect.query(sqlInsertImage, [image], (err, imageResult) => {
              if (err) return res.json(err);

              const imageId = imageResult.insertId; // Получаем ID нового изображения
              
              // Шаг 3: Добавление записи в связующую таблицу
              const sqlInsertActerImage = "INSERT INTO acterimage (acterId, imageId) VALUES (?, ?)";
              connect.query(sqlInsertActerImage, [acterId, imageId], (err) => {
                  if (err) return res.json(err);

                  return res.status(201).json({ message: 'Acter created successfully with image.', acterId, imageId });
              });
          });
      } else {
          return res.status(400).json({ message: 'Image is required.' });
      }
  });
});

// PUT маршрут для изменения актера с изображением
acterDashBoardRoute.put('/', authAdminMiddleWare, upload.single('image'), (req, res) => {
  const { fierstname, secondname,	description, id } = req.body;

  const image = req.file ? `/uploads/${req.file.filename}` : null; // Получаем путь к загруженному изображению

  if (!fierstname) {
      return res.status(400).json({ message: 'Имя актера обязательно.' });
  }

  // Шаг 1: Обновление информации об актере
  const sqlUpdateActer = "UPDATE acters SET fierstname = ?, secondname = ?, description = ?  WHERE id = ?";
  connect.query(sqlUpdateActer, [fierstname, secondname, description, id], (err, result) => {
      if (err) return res.json(err);

      // Проверка, было ли обновлено что-то
      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Актер не найден.' });
      }

      // Объект для хранения обновленной информации об актере
      const updatedActer = {
          id: id,
          fierstname: fierstname,
          secondname: secondname,
          description: description,
          image: image // Добавляем путь к изображению
      };

      // Шаг 2: Обновление изображения, если было загружено новое
      if (image) {
          const sqlInsertImage = "INSERT INTO images (image) VALUES (?)"; 
          connect.query(sqlInsertImage, [image], (err, imageResult) => {
              if (err) return res.json(err);

              const imageId = imageResult.insertId; // Получаем ID нового изображения
              
              // Шаг 3: Добавление записи в связующую таблицу
              const sqlInsertActerImage = "INSERT INTO acterimage (acterId, imageId) VALUES (?, ?)";
              connect.query(sqlInsertActerImage, [id, imageId], (err) => {
                  if (err) return res.json(err);

                  // Возвращаем обновленную информацию об актере
                  return res.status(201).json({ message: 'Актер успешно обновлен с изображением.', updatedActer });
              });
          });
      } else {
          // Если изображение не было загружено, возвращаем обновленную информацию о локации
          return res.status(200).json({ message: 'Актер успешно обновлена без нового изображения.', updatedActer });
      }
  });
});

acterDashBoardRoute.delete('/', authAdminMiddleWare, (req, res) => { 
  const { id } = req.body;

  // Проверяем, что ID был предоставлен
  if (!id) {
      return res.status(400).json({ message: 'ID обязателен.' });
  }

  const sqlDeleteActer = "DELETE FROM acters WHERE id = ?";
  
  connect.query(sqlDeleteActer, [id], (err, result) => {
      if (err) {
          return res.status(500).json({ message: 'Ошибка при удалении актера', error: err });
      }

      // Проверяем, были ли затронуты какие-либо строки
      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Актер не найден.' });
      } else {
          return res.status(200).json({ message: 'Актер успешно удален!' });
      }
  });
});

module.exports = acterDashBoardRoute;