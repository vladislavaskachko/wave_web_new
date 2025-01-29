const db = require('../config/dbConfig');

exports.getAttendance = (req, res) => {
    const { login, hashedPassword } = req.body;

    if (!login || !hashedPassword) {
        return res.status(400).json({ message: 'Необходимо указать логин и пароль' });
    }

    let studentId = null;

    // Проверяем, существует ли пользователь и получаем его student_id
    const userQuery = `
        SELECT COUNT(*) AS count, student_id 
        FROM student 
        JOIN users ON student_user_id = user_id 
        WHERE user_login = ? AND user_password = ?;
    `;

    db.query(userQuery, [login, hashedPassword], (err, userResults) => {
        if (err) {
            console.error('Ошибка запроса к базе данных:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }

        if (userResults[0].count === 0) {
            return res.status(401).json({ message: 'Неверные учетные данные' });
        }

        studentId = userResults[0].student_id;

        // Получаем данные о посещаемости
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

        db.query(attendanceQuery, [studentId], (err, attendanceResults) => {
            if (err) {
                console.error('Ошибка запроса к базе данных:', err);
                return res.status(500).json({ message: 'Ошибка на сервере' });
            }

            if (attendanceResults.length === 0) {
                return res.status(200).json({ attendance: [{ date: 'Оценок пока нет', group: '', visit: '' }] });
            }

            // Форматируем данные и отправляем ответ
            const attendance = attendanceResults.map(row => ({
                date: new Date(row.date).toLocaleDateString('ru-RU'),
                group: row.groupName,
                visit: row.visit
            }));

            res.status(200).json({ attendance });
        });
    });
};
