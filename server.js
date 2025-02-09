const PORT = 5000

const createConnection = require('./database')
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const mainRoute = require('./routes/mainRoute');
const categRoute = require('./routes/categRoute');
const eventRoute = require('./routes/eventRoute');
const acterRoute = require('./routes/acterRoute');
const ticketRoute = require('./routes/ticketRoute');
const calendarRoute = require('./routes/calendarRoute')
const locatRoute = require('./routes/locatRoute')
const loginRoute = require('./routes/loginRoute')
const registerRoute = require('./routes/registerRoute')
const resetRoute = require('./routes/resetRoute')
const profileRoute = require('./routes/profileRoute')
const carRoute = require('./routes/carRoute')
const orderRoute = require('./routes/orderRoute')
const searchRoute= require('./routes/searchRoute')
const path = require('path');

const categDashBoardRoute = require('./routes/categDashBoardRoute')
const eventDashBoardRoute = require('./routes/eventDashBoardRoute')
const acterDashBoardRoute = require('./routes/acterDashBoardRoute')
const ticketDashBoardRoute = require('./routes/ticketDashBoardRoute')
const locatDashBoardRoute = require('./routes/locatDashBoardRoute')
const orderDashBoardRoute = require('./routes/orderDashBoardRoute')
const userDashBoardRoute = require('./routes/userDashBoardRoute')
const profileDashBoardRoute = require('./routes/profileDashBoardRoute')

const app = express()
app.use(cors())
app.use(express.json())
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const connect = createConnection();

connect.connect(err=>{
  if(err){console.log(err)
    return err
  }
  else{
    console.log('Соединение установлено')
  }
})

// app.use('/', mainRoute);
app.use('/login', loginRoute);
app.use('/registr', registerRoute);
app.use('/reset', resetRoute)
app.use('/category', categRoute);
app.use('/events', eventRoute);
app.use('/acters', acterRoute);
app.use('/tickets', ticketRoute);
app.use('/event/calendar/', calendarRoute);
app.use('/locats', locatRoute);
app.use('/profile', profileRoute)
app.use('/car', carRoute)
app.use('/orders', orderRoute)
app.use('/search', searchRoute)


app.use('/admin/category/', categDashBoardRoute);
app.use('/admin/events', eventDashBoardRoute);
app.use('/admin/acters', acterDashBoardRoute);
app.use('/admin/tickets', ticketDashBoardRoute);
app.use('/admin/locations', locatDashBoardRoute);
app.use('/admin/orders', orderDashBoardRoute)
app.use('/admin/users', userDashBoardRoute)
app.use('/admin/profile', profileDashBoardRoute)

app.use((err, req, res, next) => {
  console.error('Необработанная ошибка:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, ()=>{
  console.log(PORT + ' - Порт доступен')
})