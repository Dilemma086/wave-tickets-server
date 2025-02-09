const jwt = require('jsonwebtoken');
const config = require('./../config');
const SECRET_KEY = config.SECRET_KEY;

module.exports =(async (req, res, next) => {
  
  const token = req.headers.authorization;
  
  if (!token) {
      // return res.status(401).json({ error: 'Неавторизованный доступ' });
      return res.redirect('/error401'); // Переадресация на страницу error401
  }
  try {
    const decodedToken = jwt.verify(token, SECRET_KEY);
    const userId = decodedToken.userId; 
    const isAuth = decodedToken.isAuth
    req.user = decodedToken;
    next(); 
  } 
  
  catch (error) {
    // console.error('Сообщение authMiddleware', error);
    // return res.redirect('/error401'); // Переадресация на страницу error401
    return res.status(401).json({ error: 'Неавторизованный доступ' });
  }
});
