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

exports.getStudentsByGroup = (req, res) => {
    const { groupName } = req.query; // Получаем название группы из query-параметра

    if (!groupName) {
        return res.status(400).json({ message: 'Название группы обязательно' });
    }

    const query = `
        SELECT s.student_id, CONCAT(u.user_surname, ' ', u.user_name, ' ', u.user_patronymic) AS full_name
        FROM student s
        JOIN students_groups sg ON s.student_id = sg.student_id
        JOIN groups g ON g.group_id = sg.group_id
        JOIN users u ON s.student_user_id = u.user_id
        WHERE g.group_name = ?
    `;

    db.query(query, [groupName], (err, results) => {
        if (err) {
            console.error('Ошибка при получении студентов по группе:', err);
            return res.status(500).json({ message: 'Ошибка сервера' });
        }
        res.status(200).json(results);
    });
};