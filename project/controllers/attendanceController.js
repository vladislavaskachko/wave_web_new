const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');

exports.getAttendance = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Вы не авторизованы' });
    }

    const token = authHeader.split(' ')[1]; // Берём токен из заголовка
    let userId;

    try {
        const decoded = jwt.verify(token, 'secret_key'); // !! Тот же ключ, что в `authController.js` !!
        userId = decoded.userId;
    } catch (error) {
        return res.status(403).json({ message: 'Неверный токен' });
    }

    const attendanceQuery = `
        SELECT 
            lesson_exact.lesson_exact_data AS date, 
            groups.group_name AS groupName, 
            lesson_visit.lesson_visit AS visit 
        FROM lesson_visit
        JOIN student ON student.student_id = ? AND student.student_id = lesson_visit.lesson_visit_student_id
        JOIN lesson_exact ON lesson_visit.lesson_visit_lesson_exact_id = lesson_exact.lesson_exact_id
        JOIN lesson ON lesson_exact.lesson_exact_lesson_id = lesson.lesson_id
        JOIN groups ON lesson.lesson_group_id = groups.group_id
        ORDER BY lesson_exact.lesson_exact_data DESC;
    `;

    db.query(attendanceQuery, [userId], (err, attendanceResults) => {
        if (err) {
            console.error('Ошибка запроса к базе данных:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }

        if (attendanceResults.length === 0) {
            return res.status(200).json({ attendance: [{ date: "Записей пока нет", group: '', visit: '' }] });
        }

        const attendance = attendanceResults.map(row => ({
            date: new Date(row.date).toLocaleDateString('ru-RU'),
            group: row.groupName,
            visit: row.visit
        }));

        res.status(200).json({ attendance });
    });
};
