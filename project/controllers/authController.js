const jwt = require('jsonwebtoken'); // Подключаем JWT
const db = require('../config/dbConfig');

exports.login = function (req, res) {
    var login = req.body.login;
    var password = req.body.password;
    var role = req.body.role; // Читаем роль из запроса

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
                // Здесь можно дополнительно проверить, соответствует ли роль пользователя
                // (например, сравнить role с results[0].user_role)
                const token = jwt.sign(
                    { userId: results[0].user_id },
                    'secret_key', // Замените на безопасный ключ
                    { expiresIn: '2h' }
                );

                return res.status(200).json({
                    message: 'Успешный вход',
                    token: token,
                    fullName: results[0].user_fullname,
                    role: role // Можно отправить роль в ответ, если потребуется
                });
            } else {
                return res.status(401).json({ message: 'Неверный логин или пароль' });
            }
        }
    );
};

exports.getRoles = function (req, res) {
    const { login } = req.body;

    if (!login) {
        return res.status(400).json({ message: 'Логин обязателен' });
    }

    const query = `
        SELECT ut.usertype_id, ut.usertype_name 
        FROM users u
        JOIN users_types ut_rel ON u.user_id = ut_rel.users_id
        JOIN usertype ut ON ut_rel.users_type_id = ut.usertype_id
        WHERE u.user_login = ?
    `;

    db.query(query, [login], (err, results) => {
        if (err) {
            console.error('Ошибка запроса к БД:', err);
            return res.status(500).json({ message: 'Ошибка сервера' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Роли не найдены' });
        }

        res.json(results);
    });
};
