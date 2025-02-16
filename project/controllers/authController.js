const jwt = require('jsonwebtoken'); // Подключаем JWT
const db = require('../config/dbConfig');

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
                // Генерируем реальный JWT-токен
                const token = jwt.sign(
                    { userId: results[0].user_id }, // Кодируем user_id в токен
                    'secret_key', // !! Замени на безопасный ключ !!
                    { expiresIn: '2h' } // Токен истекает через 2 часа
                );

                return res.status(200).json({
                    message: 'Успешный вход',
                    token: token, // Отправляем токен на фронт
                    fullName: results[0].user_fullname
                });
            } else {
                return res.status(401).json({ message: 'Неверный логин или пароль' });
            }
        }
    );
};
