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

exports.addChildToGroup = (req, res) => {
    const { child_id, group_id, course_id, sale } = req.body;

    if (!child_id || !group_id || !course_id || sale === undefined) {
        return res.status(400).json({ error: "Не переданы необходимые параметры" });
    }

    // Начинаем транзакцию, чтобы оба запроса выполнялись вместе
    db.beginTransaction(err => {
        if (err) {
            console.error("Ошибка при начале транзакции:", err);
            return res.status(500).json({ error: "Ошибка сервера" });
        }

        // Добавляем запись в students_groups
        db.query('INSERT INTO students_groups (student_id, group_id) VALUES (?, ?)', [child_id, group_id], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    console.error("Ошибка при добавлении ребенка в группу:", err);
                    res.status(500).json({ error: "Ошибка при добавлении ребенка в группу" });
                });
            }

            // Добавляем запись в contract
            db.query('INSERT INTO contract (contract_student_id, contract_course_id, contract_sale) VALUES (?, ?, ?)', [child_id, course_id, sale], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        console.error("Ошибка при добавлении контракта:", err);
                        res.status(500).json({ error: "Ошибка при добавлении контракта" });
                    });
                }

                // Фиксируем транзакцию
                db.commit(err => {
                    if (err) {
                        return db.rollback(() => {
                            console.error("Ошибка при фиксации транзакции:", err);
                            res.status(500).json({ error: "Ошибка сервера" });
                        });
                    }
                    res.json({ message: 'Ребенок добавлен в группу и контракт создан' });
                });
            });
        });
    });
};
exports.getGroupNameById = (req, res) => {
    const groupId = req.query.groupId; // Получаем ID группы из query параметра

    if (!groupId) {
        return res.status(400).json({ error: 'groupId is required' });
    }

    db.query('SELECT group_name FROM groups WHERE group_id = ?', [groupId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        res.json({ groupName: results[0].group_name });
    });
};