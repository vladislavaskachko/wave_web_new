const db = require('../config/dbConfig');

exports.getStudents = (req, res) => {
    db.query('SELECT s.student_id, u.user_id, u.user_surname, u.user_name, u.user_patronymic, u.user_phone FROM student s JOIN users u ON s.student_user_id = u.user_id', (err, results) => {
        if (err) {
            console.error('Ошибка при получении студентов:', err);
            return res.status(500).json({ message: 'Ошибка сервера' });
        }
        res.status(200).json(results);
    });
};