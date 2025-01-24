'use strict';
var http = require('http');
var mysql = require('mysql');
var port = process.env.PORT || 3000; 

// Создаем соединение с базой данных (все настройки дефолтные, менять не надо)
var db = mysql.createConnection({
    host: 'localhost',      
    user: 'root',           
    password: '',          
    database: 'project',    
    port: 3306     
});

// Подключение к базе данных
db.connect(function (err) {
    if (err) {
        console.error('Ошибка подключения к MySQL:', err);
        return;
    }
    console.log('Подключение к MySQL успешно установлено!');
});

// Создание HTTP-сервера
http.createServer(function (req, res) {
 
    db.query('SELECT * FROM users', function (err, results) {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Ошибка выполнения запроса к базе данных\n');
            console.error(err);
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results)); 
    });
}).listen(port, function () {
    console.log('Сервер запущен на http://localhost:' + port);
});