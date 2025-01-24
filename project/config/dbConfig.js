const mysql = require('mysql2');


const db = mysql.createConnection({
    host: 'localhost',       
    user: 'root',              
    password: '',              
    database: 'project',       
    port: 3306                
});

db.connect(err => {
    if (err) {
        console.error('������ ����������� � ���� ������:', err);
        process.exit(1); 
    }
    console.log('����������� � ���� ������ �������');
});

module.exports = db;