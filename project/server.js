'use strict';
var http = require('http');
var mysql = require('mysql');
var port = process.env.PORT || 3000; 

// ������� ���������� � ����� ������ (��� ��������� ���������, ������ �� ����)
var db = mysql.createConnection({
    host: 'localhost',      
    user: 'root',           
    password: '',          
    database: 'project',    
    port: 3306     
});

// ����������� � ���� ������
db.connect(function (err) {
    if (err) {
        console.error('������ ����������� � MySQL:', err);
        return;
    }
    console.log('����������� � MySQL ������� �����������!');
});

// �������� HTTP-�������
http.createServer(function (req, res) {
 
    db.query('SELECT * FROM users', function (err, results) {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('������ ���������� ������� � ���� ������\n');
            console.error(err);
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results)); 
    });
}).listen(port, function () {
    console.log('������ ������� �� http://localhost:' + port);
});