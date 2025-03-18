const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');

exports.getChildAttendance = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Вы не авторизованы' });
    }

    const token = authHeader.split(' ')[1];
    let userId;
    try {
        const decoded = jwt.verify(token, 'secret_key');
        userId = decoded.userId;
    } catch (error) {
        return res.status(403).json({ message: 'Неверный токен' });
    }

    const studentId = req.query.studentId;
    if (!studentId) {
        return res.status(400).json({ message: 'Не указан идентификатор ученика' });
    }

    const getParentIdQuery = `SELECT parent_id FROM parent WHERE parent_user_id = ?`;
    db.query(getParentIdQuery, [userId], (err, parentResults) => {
        if (err) {
            console.error('Ошибка запроса к базе данных:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }
        if (parentResults.length === 0) {
            return res.status(404).json({ message: 'Родитель не найден' });
        }

        const parentId = parentResults[0].parent_id;
        const checkStudentQuery = `SELECT student_id FROM student WHERE student_id = ? AND student_parent_id = ?`;
        db.query(checkStudentQuery, [studentId, parentId], (err, studentResults) => {
            if (err) {
                console.error('Ошибка запроса к базе данных:', err);
                return res.status(500).json({ message: 'Ошибка на сервере' });
            }
            if (studentResults.length === 0) {
                return res.status(404).json({ message: 'Указанный ученик не найден' });
            }

            const attendanceQuery = `
                SELECT 
                    lesson_exact.lesson_exact_data AS date, 
                    groups.group_name AS groupName, 
                    lesson_visit.lesson_visit AS visit 
                FROM lesson_visit
                JOIN lesson_exact ON lesson_visit.lesson_visit_lesson_exact_id = lesson_exact.lesson_exact_id
                JOIN lesson ON lesson_exact.lesson_exact_lesson_id = lesson.lesson_id
                JOIN groups ON lesson.lesson_group_id = groups.group_id
                WHERE lesson_visit.lesson_visit_student_id = ?
                ORDER BY lesson_exact.lesson_exact_data DESC;
            `;

            db.query(attendanceQuery, [studentId], (err, results) => {
                if (err) {
                    console.error('Ошибка запроса к базе данных:', err);
                    return res.status(500).json({ message: 'Ошибка на сервере' });
                }

                if (results.length === 0) {
                    return res.status(200).json({ attendance: [] });
                }

                const attendance = results.map(row => ({
                    date: new Date(row.date).toLocaleDateString('ru-RU'),
                    group: row.groupName,
                    visit: row.visit
                }));

                res.status(200).json({ attendance });
            });
        });
    });
};
