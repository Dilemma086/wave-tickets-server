const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('./../config');
const SECRET_KEY = config.SECRET_KEY;
const express = require('express');
const loginRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();

//логирование
loginRoute.get('/', (req, res) => { 
    const { userId } = req.query;
    const sql = "SELECT * FROM users WHERE id=?"
    connect.query(sql, [userId], (err, result)=>{
      if (err) return res.json(err);
      return res.json(result);
    })
}); 

loginRoute.post('/', (req, res) => {
  const query = 'SELECT * FROM auth';
  connect.query(query, (err, results) => {
      if (err) {
          console.error('Error executing query:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }
      
      const { email, password } = req.body; // Деструктуризация email и password из тела запроса
      const auth = results.find((auth) => auth.email === email);
      
      if (!auth) {
          return res.status(401).json({ message: 'Неверное имя пользователя' });
      }
      
      if (!password) {
          return res.status(401).json({ message: 'Введите пароль' });
      } else {
          const isValid = bcrypt.compareSync(password, auth.password); // Сравнение паролей
          if (!isValid) {
              return res.status(401).json({ message: 'Неверный пароль' });
          }
      }
      // Получаем роль пользователя по RoleID
      const getRoleQuery = 'SELECT * FROM roles WHERE id = ?'; // Запрос для получения роли
      connect.query(getRoleQuery, [auth.roleId], (err, roleData) => {
          if (err) {
              console.error('Error executing query:', err);
              return res.status(500).json({ error: 'Internal Server Error' });
          }
          if (roleData.length === 0) {
              return res.status(404).json({ error: 'Роль не найдена' });
          }
          const role = roleData[0].name; // Предполагается, что поле с названием роли называется Name
          
          // Генерация токена JWT с добавленной ролью
          const token = jwt.sign({ authId: auth.id, userId: auth.userId, role: role }, SECRET_KEY, { expiresIn: '1h' });
          res.set('Authorization', `Bearer ${token}`);
          
          // Возвращаем токен и данные пользователя
          res.json({ token, data: { ...auth, role } }); // Добавляем роль в данные пользователя
      });
  });
});


  module.exports = loginRoute