const express = require('express');
const profileDashBoardRoute = express.Router();
const createConnection = require('../database');
const connect = createConnection();
const authAdminMiddleWare = require('../middleWare/authAdminMiddleWare')

profileDashBoardRoute.get('/', authAdminMiddleWare,  (req, res)=> {
    const id = req.userId; // Извлечение id из authAdminMiddleWare
    const sql = "SELECT * FROM users WHERE id = ?"
    connect.query(sql, [id], (err, result)=>{
      if (err) return res.json(err);
      return res.json(result);
    })
})

profileDashBoardRoute.post('/', authAdminMiddleWare, (req, res)=> {
    const { fierstname, secondname, avatar, city, phone } = req.body; 
    const id = req.userId; // Извлечение id из authAdminMiddleWare

    const sql = "UPDATE users SET fierstname = ?, secondname = ?, avatar = ?, city = ?, phone = ? WHERE id = ?";
    connect.query(sql, [fierstname, secondname, avatar, city, phone, id], (err, result) => {
        if (err) {
            console.error(err); // Логирование ошибки на сервере
            return res.status(500).json({ message: 'Error updating user.', error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' }); // Обработка случая, когда заказ не найден
        }

        return res.status(200).json({ message: 'User updated successfully.', result });
    });
})

module.exports = profileDashBoardRoute;