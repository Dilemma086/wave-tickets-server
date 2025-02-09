const jwt = require('jsonwebtoken');
const config = require('./../config')
const SECRET_KEY = config.SECRET_KEY;

module.exports =(async (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.redirect('/error401'); // Переадресация на страницу error401
  }
  try {
    const decodedToken = jwt.verify(token, SECRET_KEY);
    req.user = decodedToken;
    
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next(); // Если проверка прошла успешно, продолжаем выполнение
  } 
  catch (error) {
    
    return res.status(401).json({ error: 'Неавторизованный доступ' });
  }
});
