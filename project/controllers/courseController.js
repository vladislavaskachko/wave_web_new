var db = require('../config/dbConfig'); 

exports.getCourses = (req, res) => {
    db.query('SELECT * FROM course', (err, results) => {
        if (err) {
            console.error('������ ��� ��������� ������:', err);
            return res.status(500).json({ message: '������ �������' });
        }
        res.status(200).json(results);
    });
};

// ���������� �����
exports.addCourse = (req, res) => {
    const { course_name, course_size_id, course_time, course_price, course_scheme_id } = req.body;

    if (!course_name || !course_size_id || !course_scheme_id) {
        return res.status(400).json({ message: '������������ ���� �� ���������' });
    }

    const sql = `INSERT INTO course (course_name, course_size_id, course_time, course_price, course_scheme_id) 
                 VALUES (?, ?, ?, ?, ?)`;

    db.query(sql, [course_name, course_size_id, course_time, course_price, course_scheme_id], (err, result) => {
        if (err) {
            console.error('������ ��� ���������� �����:', err);
            return res.status(500).json({ message: '������ �������' });
        }
        res.status(201).json({ message: '���� ��������!', courseId: result.insertId });
    });
};

exports.updateCourse = (req, res) => {
    const { course_id, course_name, course_size_id, course_time, course_price, course_scheme_id } = req.body;

    const sql = `UPDATE course SET course_name = ?, course_size_id = ?, course_time = ?, course_price = ?, course_scheme_id = ?
                 WHERE course_id = ?`;

    db.query(sql, [course_name, course_size_id, course_time, course_price, course_scheme_id, course_id], (err) => {
        if (err) {
            console.error('������ ��� ���������� �����:', err);
            return res.status(500).json({ message: '������ �������' });
        }
        res.status(200).json({ message: '���� ��������!' });
    });
};

exports.deleteCourse = (req, res) => {
    const { course_id } = req.params;

    db.query('DELETE FROM course WHERE course_id = ?', [course_id], (err) => {
        if (err) {
            console.error('������ ��� �������� �����:', err);
            return res.status(500).json({ message: '������ �������' });
        }
        res.status(200).json({ message: '���� ������!' });
    });
};