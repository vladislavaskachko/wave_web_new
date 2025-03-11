const db = require('../config/dbConfig');

// Получить все группы
exports.getGroups = (req, res) => {
    db.query('SELECT * FROM groups ORDER BY group_name ASC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

// Получить группы для конкретного курса
exports.getGroupsByCourse = (req, res) => {
    const { courseId } = req.params;

    db.query(
        'SELECT * FROM groups WHERE group_course_id = ? ORDER BY group_name ASC',
        [courseId],
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
};

// Добавить новую группу
exports.addGroup = (req, res) => {
    const { name, teacher_id, course_id } = req.body;

    // Логируем полученные данные для отладки
    console.log('Полученные данные для группы:', { name, teacher_id, course_id });

    if (!name || !teacher_id || !course_id) {
        return res.status(400).json({ message: 'Все поля обязательны' });
    }

    db.query(
        'INSERT INTO groups (group_name, group_teacher_id, group_course_id) VALUES (?, ?, ?)',
        [name, teacher_id, course_id],
        (err, result) => {
            if (err) {
                console.error("Ошибка при добавлении группы: ", err); // Логируем ошибку
                return res.status(500).json(err);
            }
            res.json({ message: 'Группа добавлена', group_id: result.insertId });
        }
    );
};

// Обновить группу
exports.updateGroup = (req, res) => {
    const { id } = req.params;
    const { name, teacher_id, course_id } = req.body;

    db.query(
        'UPDATE groups SET group_name = ?, group_teacher_id = ?, group_course_id = ? WHERE group_id = ?',
        [name, teacher_id, course_id, id],
        (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Группа обновлена' });
        }
    );
};

// Удалить группу
exports.deleteGroup = (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM groups WHERE group_id = ?', [id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Группа удалена' });
    });
};