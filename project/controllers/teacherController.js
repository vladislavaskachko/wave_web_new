const db = require('../config/dbConfig');

exports.getTeachers = (req, res) => {
    db.query('SELECT t.teacher_id, u.user_id, u.user_surname, u.user_name, u.user_patronymic, u.user_phone FROM teacher t JOIN users u ON t.teacher_user_id = u.user_id', (err, results) => {
        if (err) {
            console.error('Ошибка при получении учителей:', err);
            return res.status(500).json({ message: 'Ошибка сервера' });
        }
        res.status(200).json(results);
    });
};