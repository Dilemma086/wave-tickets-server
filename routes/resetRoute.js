//registrPassReset.js
const express = require('express');
const registrPassReset = express.Router();
const bcrypt = require('bcrypt');
const createConnection = require('../database');
const connect = createConnection();

registrPassReset.post('/', (req, res) => {
  const { email, password } = req.body; // Получаем данные из тела запроса
  const hashedPassword = bcrypt.hashSync(password, 10);
  const query = 'UPDATE auth SET password = ? WHERE email = ?'; // Исправленная строка запроса
  connect.query(query, [hashedPassword, email], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Пароль обновлен успешно.' });
  });
});

module.exports = registrPassReset;