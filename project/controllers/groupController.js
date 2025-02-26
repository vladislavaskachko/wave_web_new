var db = require('../config/dbConfig'); 

exports.getGroups = (req, res) => {
    db.query('SELECT * FROM groups', (err, results) => {
        if (err) {
            console.error('������ ��� ��������� �����:', err);
            return res.status(500).json({ message: '������ �������' });
        }
        res.status(200).json(results);
    });
};

// ���������� ������
exports.addGroup = (req, res) => {
    const { group_name, group_teacher_id, group_course_id, students } = req.body;

    if (!group_name || !group_teacher_id || !group_course_id) {
        return res.status(400).json({ message: '������������ ���� �� ���������' });
    }

    const sql = `INSERT INTO groups (group_name, group_teacher_id, group_course_id) VALUES (?, ?, ?)`;

    db.query(sql, [group_name, group_teacher_id, group_course_id], (err, result) => {
        if (err) {
            console.error('������ ��� ���������� ������:', err);
            return res.status(500).json({ message: '������ �������' });
        }

        res.status(201).json({ message: '������ ���������!', groupId: result.insertId });

        if (students && students.length > 0) {
            const studentSql = `INSERT INTO students_groups (student_id, group_id) VALUES ?`;
            const studentValues = students.map(studentId => [studentId, groupId]);

            db.query(studentSql, [studentValues], (err) => {
                if (err) {
                    console.error('������ ��� �������� ��������� � ������:', err);
                    return res.status(500).json({ message: '������ ��� ���������� ��������� � ������' });
                }

                res.status(201).json({ message: '������ ��������� � �������� ���������!', groupId });
            });
        } else {
            res.status(201).json({ message: '������ ���������, �� �������� �� �������!', groupId });
        }
    });
};

// �������������� ������
exports.updateGroup = (req, res) => {
    const { group_id, group_name, group_teacher_id, group_course_id } = req.body;

    const sql = `UPDATE groups SET group_name = ?, group_teacher_id = ?, group_course_id = ? WHERE group_id = ?`;

    db.query(sql, [group_name, group_teacher_id, group_course_id, group_id], (err) => {
        if (err) {
            console.error('������ ��� ���������� ������:', err);
            return res.status(500).json({ message: '������ �������' });
        }
        res.status(200).json({ message: '������ ���������!' });
    });
};

// �������� ������
exports.deleteGroup = (req, res) => {
    const { group_id } = req.params;

    db.query('DELETE FROM groups WHERE group_id = ?', [group_id], (err) => {
        if (err) {
            console.error('������ ��� �������� ������:', err);
            return res.status(500).json({ message: '������ �������' });
        }
        res.status(200).json({ message: '������ �������!' });
    });
};