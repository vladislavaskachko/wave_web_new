const db = require('../config/dbConfig');

// Получить все курсы (без групп)
exports.getCourses = (req, res) => {
    db.query('SELECT * FROM course ORDER BY course_name ASC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

// Получить курсы с вложенными группами (древовидная структура)
exports.getCoursesWithGroups = (req, res) => {
    db.query(`
        SELECT 
            c.course_id, c.course_name, c.course_time, c.course_price, 
            g.group_id, g.group_name, g.group_teacher_id
        FROM course c
        LEFT JOIN groups g ON c.course_id = g.group_course_id
        ORDER BY c.course_name ASC, g.group_name ASC
    `, (err, results) => {
        if (err) return res.status(500).json(err);

        const coursesMap = {};
        results.forEach(row => {
            if (!coursesMap[row.course_id]) {
                coursesMap[row.course_id] = {
                    course_id: row.course_id,
                    course_name: row.course_name,
                    course_time: row.course_time,
                    course_price: row.course_price,
                    groups: []
                };
            }
            if (row.group_id) {
                coursesMap[row.course_id].groups.push({
                    group_id: row.group_id,
                    group_name: row.group_name,
                    group_teacher_id: row.group_teacher_id
                });
            }
        });

        res.json(Object.values(coursesMap));
    });
};

// Добавить новый курс
exports.addCourse = (req, res) => {
    const { name, time, price, size_id, scheme_id } = req.body;
    console.log('Полученные данные курса:', { name, time, price, size_id, scheme_id });

    if (!name || !time || !price || !size_id || !scheme_id) {
        return res.status(400).json({ message: 'Все поля обязательны' });
    }

    // Дальше идет запрос в базу данных
    db.query(
        'INSERT INTO course (course_name, course_time, course_price, course_size_id, course_scheme_id) VALUES (?, ?, ?, ?, ?)',
        [name, time, price, size_id, scheme_id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Курс добавлен', course_id: result.insertId });
        }
    );
};
// Обновить курс
exports.updateCourse = (req, res) => {
    const { id } = req.params;
    const { name, time, price } = req.body;

    db.query(
        'UPDATE course SET course_name = ?, course_time = ?, course_price = ? WHERE course_id = ?',
        [name, time, price, id],
        (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Курс обновлен' });
        }
    );
};

// Удалить курс
exports.deleteCourse = (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM course WHERE course_id = ?', [id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Курс удален' });
    });
};