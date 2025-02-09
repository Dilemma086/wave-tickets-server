//register.js
const express = require('express');
const registerRoute = express.Router();
const bcrypt = require('bcrypt');
const createConnection = require('../database');
const connect = createConnection();

registerRoute.post('/', (req, res) => {
  const { email, password } = req.body;
  const userQuery = 'INSERT INTO users (firstname, secondname, avatar, city, phone) VALUES (?)';
  const userValues = [
    req.body.firstname,
    req.body.secondname,
    req.body.avatar,
    req.body.city,
    req.body.phone
  ];
  connect.query(userQuery, [userValues], (err, results) => {
    if (err) {
      console.error('Ошибка выполнения запроса:', err);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
    const userId = results.insertId; // Получаем новый идентификатор пользователя
    const query = 'INSERT INTO auth (email, password, roleId, userId) VALUES (?, ?, 1, ?)';
    const hashedPassword = bcrypt.hashSync(password, 10);
    connect.query(query, [email, hashedPassword, userId], (err, data) => {
      if (err) return res.status(500).json(err);
      // Получаем данные пользователя из таблицы users
      const getUserQuery = 'SELECT * FROM users WHERE id = ?';
      connect.query(getUserQuery, [userId], (err, userData) => {
        if (err) {
          console.error('Ошибка выполнения запроса:', err);
          return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
        res.json({ message: 'Пользователь создан успешно', data: userData[0] });
      });
    });
  });
});


module.exports = registerRoute;