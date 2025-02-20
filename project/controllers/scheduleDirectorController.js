const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');

// Получение групп
exports.getGroups = (req, res) => {
    const groupsQuery = 'SELECT group_id, group_name FROM groups ORDER BY group_name ASC';

    db.query(groupsQuery, (err, groupsResults) => {
        if (err) {
            console.error('Ошибка запроса к базе данных (группы):', err);
            return res.status(500).json({ message: 'Ошибка при получении данных о группах' });
        }

        if (groupsResults.length === 0) {
            return res.status(200).json({ groups: [] });
        }

        const groups = groupsResults.map(group => ({
            id: group.group_id,
            name: group.group_name
        }));

        res.status(200).json({ groups });
    });
};

// Получение дней недели
exports.getDays = (req, res) => {
    const daysQuery = 'SELECT day_id, day_name FROM day ORDER BY day_id ASC';

    db.query(daysQuery, (err, daysResults) => {
        if (err) {
            console.error('Ошибка запроса к базе данных (дни недели):', err);
            return res.status(500).json({ message: 'Ошибка при получении данных о днях недели' });
        }

        if (daysResults.length === 0) {
            return res.status(200).json({ days: [] });
        }

        const days = daysResults.map(day => ({
            id: day.day_id,
            name: day.day_name
        }));

        res.status(200).json({ days });
    });
};

// Получение комнат
exports.getRooms = (req, res) => {
    const roomsQuery = 'SELECT room_id, room_name FROM room ORDER BY room_name ASC';

    db.query(roomsQuery, (err, roomsResults) => {
        if (err) {
            console.error('Ошибка запроса к базе данных (комнаты):', err);
            return res.status(500).json({ message: 'Ошибка при получении данных о комнатах' });
        }

        if (roomsResults.length === 0) {
            return res.status(200).json({ rooms: [] });
        }

        const rooms = roomsResults.map(room => ({
            id: room.room_id,
            name: room.room_name
        }));

        res.status(200).json({ rooms });
    });
};

// Добавление урока
exports.addLesson = (req, res) => {
    const { groupId, dayId, startTime, endTime, roomId } = req.body;

    if (!groupId || !dayId || !startTime || !endTime || !roomId) {
        return res.status(400).json({ message: 'Заполните все поля' });
    }

    // Проверка на пересечение уроков
    const checkConflictQuery = `
        SELECT * FROM lesson 
        WHERE lesson_day_id = ? AND lesson_room_id = ?
        AND ((lesson_start < ? AND lesson_end > ?) OR (lesson_start < ? AND lesson_end > ?))
    `;

    db.query(
        checkConflictQuery,
        [dayId, roomId, endTime, startTime, startTime, endTime],
        (err, conflicts) => {
            if (err) {
                console.error('Ошибка при проверке расписания:', err);
                return res.status(500).json({ message: 'Ошибка при проверке расписания' });
            }

            if (conflicts.length > 0) {
                return res.status(400).json({ message: 'Конфликт времени: в это время уже есть урок' });
            }

            // Если конфликта нет, добавляем урок
            const addLessonQuery = `
                INSERT INTO lesson 
                (lesson_group_id, lesson_day_id, lesson_start, lesson_end, lesson_room_id)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                addLessonQuery,
                [groupId, dayId, startTime, endTime, roomId],
                (err, result) => {
                    if (err) {
                        console.error('Ошибка при добавлении урока:', err);
                        return res.status(500).json({ message: 'Ошибка при добавлении урока' });
                    }

                    res.status(201).json({ message: 'Урок добавлен успешно' });
                }
            );
        }
    );
};

// Получение всех уроков
exports.getLessons = (req, res) => {
    const query = `
        SELECT 
            lesson.lesson_id, lesson.lesson_start, lesson.lesson_end, 
            lesson.lesson_group_id, lesson.lesson_day_id, lesson.lesson_room_id,
            groups.group_name, room.room_name, day.day_name 
        FROM lesson
        JOIN groups ON lesson.lesson_group_id = groups.group_id
        JOIN room ON lesson.lesson_room_id = room.room_id
        JOIN day ON lesson.lesson_day_id = day.day_id
        ORDER BY lesson.lesson_day_id, lesson.lesson_start;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Ошибка при получении уроков:', err);
            return res.status(500).json({ message: 'Ошибка при загрузке расписания' });
        }

        res.status(200).json({ lessons: results });
    });
};

