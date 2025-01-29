const mysql = require('mysql2');


const db = mysql.createConnection({
    host: 'localhost',       
    user: 'root',              
    password: '',              
    database: 'wave',       
    port: 3306,
    charset: 'utf8mb4'
});

db.connect(err => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err);
        process.exit(1); 
    }
    console.log('Подключение к базе данных успешно');
});

module.exports = db;