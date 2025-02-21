const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');

// API для получения уроков для конкретного дня
exports.getLessons = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Вы не авторизованы' });
    }

    const token = authHeader.split(' ')[1]; // Берем токен из заголовка
    let userId;

    try {
        const decoded = jwt.verify(token, 'secret_key'); // Декодируем токен
        userId = decoded.userId; // Извлекаем userId из токена
    } catch (error) {
        return res.status(403).json({ message: 'Неверный токен' });
    }

    const { dayId } = req.query; // Получаем dayId из query-параметров

    // Сначала получаем student_id по userId
    const getStudentIdQuery = `SELECT student_id FROM student WHERE student_user_id = ?`;

    db.query(getStudentIdQuery, [userId], (err, studentResults) => {
        if (err) {
            console.error('Ошибка запроса к базе данных:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }

        if (studentResults.length === 0) {
            return res.status(404).json({ message: 'Студент не найден' });
        }

        const studentId = studentResults[0].student_id;

        // Запрос с фильтрацией по student_id
        const lessonsQuery = `
            SELECT
                groups.group_name AS group_name,
                course.course_name AS course_name,
                day.day_name AS day_name,
                lesson.lesson_start AS lesson_start,
                lesson.lesson_end AS lesson_end,
                room.room_name AS room_name,
                users.user_surname AS teacher_surname,
                users.user_name AS teacher_name,
                users.user_patronymic AS teacher_patronymic  -- Добавляем отчество
            FROM lesson
            JOIN groups ON lesson.lesson_group_id = groups.group_id
            JOIN course ON groups.group_course_id = course.course_id
            JOIN day ON lesson.lesson_day_id = day.day_id
            JOIN room ON lesson.lesson_room_id = room.room_id
            JOIN teacher ON groups.group_teacher_id = teacher.teacher_id
            JOIN users ON teacher.teacher_user_id = users.user_id
            JOIN students_groups ON groups.group_id = students_groups.group_id
            WHERE students_groups.student_id = ? AND lesson.lesson_day_id = ?;
        `;

        db.query(lessonsQuery, [studentId, dayId], (err, lessonsResults) => {
            if (err) {
                console.error('Ошибка запроса к базе данных:', err);
                return res.status(500).json({ message: 'Ошибка на сервере' });
            }
            /*console.log('Результаты запроса:', lessonsResults); // Это поможет вам увидеть, что приходит из базы данных*/

            if (lessonsResults.length === 0) {
                return res.status(200).json({ lessons: [] });
            }

            const lessons = lessonsResults.map(row => ({
                time: `${row.lesson_start} - ${row.lesson_end}`,
                room: row.room_name,
                group: row.group_name,
                teacher_name: `${row.teacher_name} ${row.teacher_patronymic} ${row.teacher_surname}`,  // Полное ФИО учителя
                subject: row.course_name
            }));

            res.status(200).json({ lessons });
        });
    });
};
