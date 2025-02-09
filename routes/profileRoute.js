const express = require('express');
const profileRoute = express.Router();
const createConnection = require('../database');
const authMiddleware = require('./../middleWare/authMiddleware')
const connect = createConnection();

profileRoute.get('/', authMiddleware, (req, res) => {
  const authId = req.user.authId; // Получаем идентификатор пользователя из middleware
  const sql =  `
  SELECT users.*
  FROM users
  JOIN auth ON users.id = auth.UserId WHERE auth.id = ${authId}
`;
  connect.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка сервера', error: err });
    }
    if (err) {
      return res.status(401).json({ message: 'Ошика авторизации', error: err });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    return res.json(result[0]);
  });
});

profileRoute.post('/', authMiddleware, (req, res) => {
  const id = req.userId; // Получаем ID пользователя из middleware
  const { firstname, secondname, avatar, city, phone } = req.body; // Получаем данные из тела запроса
  const sql = "UPDATE users SET firstname = ?, secondname = ?, avatar = ?, city = ?, phone = ? WHERE id = ?";
  // Передаем значения в запрос
  connect.query(sql, [firstname, secondname, avatar, city, phone, id], (err, result) => {
      if (err) return res.json(err);
      return res.json({ message: 'User  updated successfully', result });
  });
});

module.exports = profileRoute;