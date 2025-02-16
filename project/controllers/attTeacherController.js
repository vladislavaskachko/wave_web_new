const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');

// Функция для форматирования даты из формата DD.MM.YYYY в YYYY-MM-DD
function formatDate(inputDate) {
    if (!inputDate || typeof inputDate !== 'string') {
        throw new Error('Дата не передана или имеет неправильный формат');
    }

    // Попробуем сначала обработать формат DD.MM.YYYY
    const dateParts = inputDate.split('.');

    if (dateParts.length === 3 && dateParts[0].length === 2 && dateParts[1].length === 2 && dateParts[2].length === 4) {
        // Если дата в формате DD.MM.YYYY
        const [day, month, year] = dateParts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Проверка формата YYYY-MM-DD
    const isoDateParts = inputDate.split('-');
    if (isoDateParts.length === 3 && isoDateParts[0].length === 4 && isoDateParts[1].length === 2 && isoDateParts[2].length === 2) {
        // Если дата уже в формате YYYY-MM-DD
        return inputDate;
    }

    throw new Error('Дата имеет неправильный формат');
}




// Получение групп преподавателя
exports.getTeacherGroups = (req, res) => {
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

    const groupQuery = `
        SELECT groups.group_name FROM groups 
        JOIN teacher ON groups.group_teacher_id = teacher.teacher_id 
        JOIN users ON teacher.teacher_user_id = users.user_id 
        WHERE users.user_id = ? 
        ORDER BY groups.group_name ASC;
    `;

    db.query(groupQuery, [userId], (err, groupResults) => {
        if (err) {
            console.error('Ошибка запроса к базе данных:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }
        res.status(200).json({ groups: groupResults.map(row => row.group_name) });
    });
};

// Получение посещаемости по группе
exports.getAttendance = (req, res) => {
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

    const { group } = req.query;
    if (!group) {
        return res.status(400).json({ message: 'Группа не указана' });
    }

    const attendanceQuery = `
        SELECT
    CONCAT(users.user_surname, ' ', users.user_name, ' ', users.user_patronymic) AS student,
    lesson_exact.lesson_exact_data AS date,
    IFNULL(lesson_visit.lesson_visit, 'н') AS status 
    FROM students_groups
    JOIN student ON students_groups.student_id = student.student_id
    JOIN users ON student.student_user_id = users.user_id
    JOIN groups ON students_groups.group_id = groups.group_id
    LEFT JOIN lesson ON lesson.lesson_group_id = groups.group_id
    LEFT JOIN lesson_exact ON lesson_exact.lesson_exact_lesson_id = lesson.lesson_id
    LEFT JOIN lesson_visit ON lesson_visit.lesson_visit_student_id = student.student_id
        AND lesson_visit.lesson_visit_lesson_exact_id = lesson_exact.lesson_exact_id
    WHERE groups.group_name = ?
    ORDER BY lesson_exact.lesson_exact_data DESC;

    `;

    db.query(attendanceQuery, [group], (err, attendanceResults) => {
        if (err) {
            console.error('Ошибка запроса к базе данных:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }

        const attendance = attendanceResults.map(row => ({
            student: row.student,
            date: new Date(row.date).toLocaleDateString('ru-RU'),
            status: row.status
        }));

        res.status(200).json({ attendance });
    });
};

// Обновление посещаемости
exports.updateAttendance = (req, res) => {
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

    const { group, student, date, status } = req.body;

    if (!group || !student || !date || !status) {
        return res.status(400).json({ message: 'Недостающие параметры' });
    }

    const formattedDate = formatDate(date); // Используем эту функцию для форматирования

    // 1. Проверка, существует ли запись посещаемости для студента
    const checkQuery = `
        SELECT lesson_visit_id
        FROM lesson_visit
        WHERE lesson_visit_student_id = (
            SELECT student_id 
            FROM student
            JOIN users ON student.student_user_id = users.user_id
            WHERE CONCAT(users.user_surname, ' ', users.user_name, ' ', users.user_patronymic) = ?
        )
        AND lesson_visit_lesson_exact_id = (
            SELECT lesson_exact_id
            FROM lesson_exact
            JOIN lesson ON lesson_exact.lesson_exact_lesson_id = lesson.lesson_id
            JOIN groups ON lesson.lesson_group_id = groups.group_id
            WHERE groups.group_name = ? AND DATE(lesson_exact.lesson_exact_data) = ?
        );
    `;

    db.query(checkQuery, [student, group, formattedDate], (err, result) => {
        if (err) {
            console.error('Ошибка запроса на проверку записи:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }

        if (result.length > 0) {
            // Запись существует, обновляем посещаемость
            const updateQuery = `
                UPDATE lesson_visit
                SET lesson_visit = ?
                WHERE lesson_visit_student_id = (
                    SELECT student_id
                    FROM student
                    JOIN users ON student.student_user_id = users.user_id
                    WHERE CONCAT(users.user_surname, ' ', users.user_name, ' ', users.user_patronymic) = ?
                )
                AND lesson_visit_lesson_exact_id = (
                    SELECT lesson_exact_id
                    FROM lesson_exact
                    JOIN lesson ON lesson_exact.lesson_exact_lesson_id = lesson.lesson_id
                    JOIN groups ON lesson.lesson_group_id = groups.group_id
                    WHERE groups.group_name = ? AND DATE(lesson_exact.lesson_exact_data) = ?
                );
            `;

            db.query(updateQuery, [status, student, group, formattedDate], (err, updateResult) => {
                if (err) {
                    console.error('Ошибка обновления посещаемости:', err);
                    return res.status(500).json({ message: 'Ошибка на сервере' });
                }

                if (updateResult.affectedRows === 0) {
                    return res.status(404).json({ message: 'Не удалось обновить посещаемость' });
                }

                res.status(200).json({ success: true, message: 'Посещаемость обновлена' });
            });
        } else {
            // Записи нет, создаем новую
            const insertQuery = `
                INSERT INTO lesson_visit (lesson_visit_student_id, lesson_visit_lesson_exact_id, lesson_visit)
                VALUES (
                    (SELECT student_id FROM student
                        JOIN users ON student.student_user_id = users.user_id
                        WHERE CONCAT(users.user_surname, ' ', users.user_name, ' ', users.user_patronymic) = ?),
                    (SELECT lesson_exact_id FROM lesson_exact
                        JOIN lesson ON lesson_exact.lesson_exact_lesson_id = lesson.lesson_id
                        JOIN groups ON lesson.lesson_group_id = groups.group_id
                        WHERE groups.group_name = ? AND DATE(lesson_exact.lesson_exact_data) = ?),
                    ?
                );
            `;

            db.query(insertQuery, [student, group, formattedDate, status], (err, insertResult) => {
                if (err) {
                    console.error('Ошибка добавления посещаемости:', err);
                    return res.status(500).json({ message: 'Ошибка на сервере' });
                }

                res.status(200).json({ success: true, message: 'Посещаемость добавлена' });
            });
        }
    });
};

// Добавление новой даты урока для группы
exports.addLessonDate = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('Ошибка: нет авторизации');
        return res.status(401).json({ message: 'Вы не авторизованы' });
    }

    const token = authHeader.split(' ')[1];
    let userId;

    try {
        const decoded = jwt.verify(token, 'secret_key');
        userId = decoded.userId;
    } catch (error) {
        console.log('Ошибка при декодировании токена:', error);
        return res.status(403).json({ message: 'Неверный токен' });
    }

    const { lessonDate, lessonId } = req.body; // Заменили groupName на lessonId

    //console.log('Полученные данные:', { lessonDate, lessonId });

    if (!lessonDate || !lessonId) {
        console.log('Ошибка: недостающие параметры');
        return res.status(400).json({ message: 'Дата урока или ID урока не указаны' });
    }

    const formattedDate = formatDate(lessonDate);
    //console.log('Отформатированная дата:', formattedDate);

    // Проверяем, существует ли уже урок с такой датой
    const checkLessonQuery = `
        SELECT lesson_exact_id
        FROM lesson_exact
        WHERE lesson_exact_lesson_id = ? AND lesson_exact_data = ?;
    `;

    db.query(checkLessonQuery, [lessonId, formattedDate], (err, checkResult) => {
        if (err) {
            console.error('Ошибка проверки существования урока:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }

        if (checkResult.length > 0) {
            console.log('Ошибка: урок с такой датой уже существует');
            return res.status(400).json({ message: 'Урок с такой датой уже существует' });
        }

        // Добавляем новую дату урока в таблицу lesson_exact
        const insertLessonQuery = `
            INSERT INTO lesson_exact (lesson_exact_lesson_id, lesson_exact_data)
            VALUES (?, ?);
        `;

        db.query(insertLessonQuery, [lessonId, formattedDate], (err, insertResult) => {
            if (err) {
                console.error('Ошибка добавления даты урока:', err);
                return res.status(500).json({ message: 'Ошибка на сервере' });
            }

            console.log('Дата урока успешно добавлена');
            res.status(200).json({ success: true, message: 'Дата урока успешно добавлена' });
        });
    });
};


exports.getLessonsByGroup = (req, res) => {
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

    const { groupName } = req.query; // Получаем название группы из запроса

    if (!groupName) {
        return res.status(400).json({ message: 'Не указано название группы' });
    }

    // Получаем group_id по названию группы
    const getGroupIdQuery = `SELECT group_id FROM groups WHERE group_name = ?`;

    db.query(getGroupIdQuery, [groupName], (err, result) => {
        if (err) {
            console.error('Ошибка при получении group_id:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Группа не найдена' });
        }

        const groupId = result[0].group_id;

        // Обновленный SQL-запрос с JOIN
        const getLessonsQuery = `
            SELECT 
                l.lesson_id, 
                d.day_name,  -- Получаем название дня
                l.lesson_start, 
                l.lesson_end 
            FROM lesson l
            JOIN day d ON l.lesson_day_id = d.day_id
            WHERE l.lesson_group_id = ?;
        `;

        db.query(getLessonsQuery, [groupId], (err, lessons) => {
            if (err) {
                console.error('Ошибка при получении уроков:', err);
                return res.status(500).json({ message: 'Ошибка на сервере' });
            }

            res.status(200).json({ lessons });
        });
    });
};

// Удаление урока по дате
exports.deleteLessonDate = (req, res) => {
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

    const { lessonDate, group } = req.body;

    if (!lessonDate || !group) {
        return res.status(400).json({ message: 'Дата урока или группа не указаны' });
    }

    const formattedDate = formatDate(lessonDate);

    // Начнем с удаления посещаемости для этого урока
    const deleteAttendanceQuery = `
        DELETE lv
        FROM lesson_visit lv
        JOIN lesson_exact le ON lv.lesson_visit_lesson_exact_id = le.lesson_exact_id
        JOIN lesson l ON le.lesson_exact_lesson_id = l.lesson_id
        JOIN groups g ON l.lesson_group_id = g.group_id
        WHERE DATE(le.lesson_exact_data) = ? AND g.group_name = ?;
    `;

    db.query(deleteAttendanceQuery, [formattedDate, group], (err, result) => {
        if (err) {
            console.error('Ошибка при удалении посещаемости:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }

        // Теперь удалим сам урок из таблицы lesson_exact
        const deleteLessonQuery = `
            DELETE le
            FROM lesson_exact le
            JOIN lesson l ON le.lesson_exact_lesson_id = l.lesson_id
            JOIN groups g ON l.lesson_group_id = g.group_id
            WHERE DATE(le.lesson_exact_data) = ? AND g.group_name = ?;
        `;

        db.query(deleteLessonQuery, [formattedDate, group], (err, result) => {
            if (err) {
                console.error('Ошибка при удалении урока:', err);
                return res.status(500).json({ message: 'Ошибка на сервере' });
            }

            // Если урок был успешно удален
            res.status(200).json({ success: true, message: 'Урок и связанные данные успешно удалены' });
        });
    });
};






