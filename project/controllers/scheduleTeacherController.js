const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');

exports.getLessonsForTeacher = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Вы не авторизованы' });
    }

    const token = authHeader.split(' ')[1]; // Получаем токен
    let userId;

    try {
        const decoded = jwt.verify(token, 'secret_key'); // Декодируем токен
        userId = decoded.userId; // ID пользователя из токена
    } catch (error) {
        return res.status(403).json({ message: 'Неверный токен' });
    }

    const { dayId } = req.query; // Получаем dayId из запроса

    // Проверка на существование и валидность dayId
    if (!dayId || isNaN(dayId)) {
        return res.status(400).json({ message: 'Некорректный dayId' });
    }

    // Получаем teacher_id по userId
    const getTeacherIdQuery = `SELECT teacher_id FROM teacher WHERE teacher_user_id = ?`;

    db.query(getTeacherIdQuery, [userId], (err, teacherResults) => {
        if (err) {
            console.error('Ошибка при получении teacher_id:', err);
            return res.status(500).json({ message: 'Ошибка сервера' });
        }

        if (teacherResults.length === 0) {
            return res.status(404).json({ message: 'Учитель не найден' });
        }

        const teacherId = teacherResults[0].teacher_id;

        // Запрос для получения расписания
        const lessonsQuery = `
            SELECT 
                groups.group_name AS group_name,
                course.course_name AS course_name,
                day.day_name AS day_name,
                lesson.lesson_start AS lesson_start,
                lesson.lesson_end AS lesson_end,
                room.room_name AS room_name
            FROM lesson
            JOIN groups ON lesson.lesson_group_id = groups.group_id
            JOIN course ON groups.group_course_id = course.course_id
            JOIN day ON lesson.lesson_day_id = day.day_id
            JOIN room ON lesson.lesson_room_id = room.room_id
            WHERE groups.group_teacher_id = ? AND lesson.lesson_day_id = ?;
        `;

        db.query(lessonsQuery, [teacherId, dayId], (err, lessonsResults) => {
            if (err) {
                console.error('Ошибка при получении расписания:', err);
                return res.status(500).json({ message: 'Ошибка сервера' });
            }

            if (lessonsResults.length === 0) {
                return res.status(200).json({ lessons: [] });
            }

            const lessons = lessonsResults.map(row => ({
                time: `${row.lesson_start} - ${row.lesson_end}`,
                room: row.room_name,
                group: row.group_name,
                subject: row.course_name
            }));

            res.status(200).json({ lessons });
        });
    });
};
