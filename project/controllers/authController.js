const db = require('../config/dbConfig'); 
//const jwt = require('jsonwebtoken'); // Добавляем JWT

exports.login = function (req, res) {
    var login = req.body.login;
    var password = req.body.password;

    if (!login || !password) {
        return res.status(400).json({ message: 'Введите логин и пароль' });
    }

    db.query(
        'SELECT * FROM users WHERE user_login = ? AND user_password = ?',
        [login, password],
        function (err, results) {
            if (err) {
                console.error('Ошибка выполнения запроса к базе данных:', err);
                return res.status(500).json({ message: 'Ошибка на сервере' });
            }

            if (results.length > 0) {

                //const token = jwt.sign(
                //    { userId: results[0].user_id }, // Создаём токен с user_id
                //    'secret_key', // Заменить на безопасный ключ
                //    { expiresIn: '2h' } // Токен действует 2 часа
                //);

                return res.status(200).json({
                    message: 'Успешный вход',
                    token: 'example-token', //token 
                    fullName: results[0].user_fullname 
                });
            } else {
                return res.status(401).json({ message: 'Неверный логин или пароль' });
            }
        }
    );
};