const db = require('../config/dbConfig');

exports.addUser = (req, res) => {
    const { surname, name, patronymic, phone, login, password, types, birthday, parent_id } = req.body;

    if (!types || types.length === 0) {
        return res.status(400).json({ message: 'Необходимо указать тип пользователя' });
    }

    db.query(
        'INSERT INTO users (user_surname, user_name, user_patronymic, user_phone, user_login, user_password) VALUES (?, ?, ?, ?, ?, ?)',
        [surname, name, patronymic, phone, login, password],
        (err, result) => {
            if (err) return res.status(500).json(err);

            const userId = result.insertId;

            // Запись в users_types
            const userTypeQueries = types.map(type =>
                new Promise((resolve, reject) => {
                    db.query('INSERT INTO users_types (users_id, users_type_id) VALUES (?, ?)', [userId, type], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                })
            );

            // Дополнительные записи в student, teacher, parent
            if (types.includes(3)) {  // Ученик
                userTypeQueries.push(new Promise((resolve, reject) => {
                    db.query('INSERT INTO student (student_user_id, student_parent_id, student_dirthday) VALUES (?, ?, ?)',
                        [userId, parent_id || null, birthday || null], (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                }));
            }

            if (types.includes(2)) {  // Учитель
                userTypeQueries.push(new Promise((resolve, reject) => {
                    db.query('INSERT INTO teacher (teacher_user_id) VALUES (?)', [userId], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                }));
            }

            if (types.includes(4)) {  // Родитель
                userTypeQueries.push(new Promise((resolve, reject) => {
                    db.query('INSERT INTO parent (parent_user_id) VALUES (?)', [userId], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                }));
            }

            Promise.all(userTypeQueries)
                .then(() => res.json({ message: 'User added successfully', userId }))
                .catch(err => res.status(500).json(err));
        }
    );
};

exports.getUsers = (req, res) => {
    db.query(`
    SELECT u.user_id, u.user_surname, u.user_name, u.user_patronymic, u.user_phone, GROUP_CONCAT(ut.users_type_id) AS types
    FROM users u
    LEFT JOIN users_types ut ON u.user_id = ut.users_id
    GROUP BY u.user_id
    ORDER BY u.user_surname ASC;  -- Сортировка по фамилии
  `, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results.map(user => ({
            ...user,
            types: user.types ? user.types.split(',').map(Number) : []
        })));
    });
};

exports.deleteUser = (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM users WHERE user_id = ?', [id], err => {
        if (err) return res.status(500).json(err);
        db.query('DELETE FROM users_types WHERE users_id = ?', [id], () => {
            res.json({ message: 'User deleted successfully' });
        });
    });
};

exports.getUserDetails = (req, res) => {
    const { id } = req.params;

    db.query(`
    SELECT u.*, GROUP_CONCAT(ut.users_type_id) AS types,
           s.student_birthday, s.student_parent_id AS parent_id,
           t.teacher_subject, p.parent_user_id
    FROM users u
    LEFT JOIN users_types ut ON u.user_id = ut.users_id
    LEFT JOIN student s ON u.user_id = s.student_user_id
    LEFT JOIN teacher t ON u.user_id = t.teacher_user_id
    LEFT JOIN parent p ON u.user_id = p.parent_user_id
    WHERE u.user_id = ?
    GROUP BY u.user_id
    `, [id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length > 0) {
            const user = results[0];
            res.json({
                ...user,
                types: user.types ? user.types.split(',').map(Number) : []
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    });
};