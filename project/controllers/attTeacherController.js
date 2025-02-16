const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');

// ������� ��� �������������� ���� �� ������� DD.MM.YYYY � YYYY-MM-DD
function formatDate(inputDate) {
    if (!inputDate || typeof inputDate !== 'string') {
        throw new Error('���� �� �������� ��� ����� ������������ ������');
    }

    // ��������� ������� ���������� ������ DD.MM.YYYY
    const dateParts = inputDate.split('.');

    if (dateParts.length === 3 && dateParts[0].length === 2 && dateParts[1].length === 2 && dateParts[2].length === 4) {
        // ���� ���� � ������� DD.MM.YYYY
        const [day, month, year] = dateParts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // �������� ������� YYYY-MM-DD
    const isoDateParts = inputDate.split('-');
    if (isoDateParts.length === 3 && isoDateParts[0].length === 4 && isoDateParts[1].length === 2 && isoDateParts[2].length === 2) {
        // ���� ���� ��� � ������� YYYY-MM-DD
        return inputDate;
    }

    throw new Error('���� ����� ������������ ������');
}




// ��������� ����� �������������
exports.getTeacherGroups = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: '�� �� ������������' });
    }

    const token = authHeader.split(' ')[1];
    let userId;

    try {
        const decoded = jwt.verify(token, 'secret_key');
        userId = decoded.userId;
    } catch (error) {
        return res.status(403).json({ message: '�������� �����' });
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
            console.error('������ ������� � ���� ������:', err);
            return res.status(500).json({ message: '������ �� �������' });
        }
        res.status(200).json({ groups: groupResults.map(row => row.group_name) });
    });
};

// ��������� ������������ �� ������
exports.getAttendance = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: '�� �� ������������' });
    }

    const token = authHeader.split(' ')[1];
    let userId;

    try {
        const decoded = jwt.verify(token, 'secret_key');
        userId = decoded.userId;
    } catch (error) {
        return res.status(403).json({ message: '�������� �����' });
    }

    const { group } = req.query;
    if (!group) {
        return res.status(400).json({ message: '������ �� �������' });
    }

    const attendanceQuery = `
        SELECT
    CONCAT(users.user_surname, ' ', users.user_name, ' ', users.user_patronymic) AS student,
    lesson_exact.lesson_exact_data AS date,
    IFNULL(lesson_visit.lesson_visit, '�') AS status 
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
            console.error('������ ������� � ���� ������:', err);
            return res.status(500).json({ message: '������ �� �������' });
        }

        const attendance = attendanceResults.map(row => ({
            student: row.student,
            date: new Date(row.date).toLocaleDateString('ru-RU'),
            status: row.status
        }));

        res.status(200).json({ attendance });
    });
};

// ���������� ������������
exports.updateAttendance = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: '�� �� ������������' });
    }

    const token = authHeader.split(' ')[1];
    let userId;

    try {
        const decoded = jwt.verify(token, 'secret_key');
        userId = decoded.userId;
    } catch (error) {
        return res.status(403).json({ message: '�������� �����' });
    }

    const { group, student, date, status } = req.body;

    if (!group || !student || !date || !status) {
        return res.status(400).json({ message: '����������� ���������' });
    }

    const formattedDate = formatDate(date); // ���������� ��� ������� ��� ��������������

    // 1. ��������, ���������� �� ������ ������������ ��� ��������
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
            console.error('������ ������� �� �������� ������:', err);
            return res.status(500).json({ message: '������ �� �������' });
        }

        if (result.length > 0) {
            // ������ ����������, ��������� ������������
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
                    console.error('������ ���������� ������������:', err);
                    return res.status(500).json({ message: '������ �� �������' });
                }

                if (updateResult.affectedRows === 0) {
                    return res.status(404).json({ message: '�� ������� �������� ������������' });
                }

                res.status(200).json({ success: true, message: '������������ ���������' });
            });
        } else {
            // ������ ���, ������� �����
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
                    console.error('������ ���������� ������������:', err);
                    return res.status(500).json({ message: '������ �� �������' });
                }

                res.status(200).json({ success: true, message: '������������ ���������' });
            });
        }
    });
};

// ���������� ����� ���� ����� ��� ������
exports.addLessonDate = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('������: ��� �����������');
        return res.status(401).json({ message: '�� �� ������������' });
    }

    const token = authHeader.split(' ')[1];
    let userId;

    try {
        const decoded = jwt.verify(token, 'secret_key');
        userId = decoded.userId;
    } catch (error) {
        console.log('������ ��� ������������� ������:', error);
        return res.status(403).json({ message: '�������� �����' });
    }

    const { lessonDate, lessonId } = req.body; // �������� groupName �� lessonId

    //console.log('���������� ������:', { lessonDate, lessonId });

    if (!lessonDate || !lessonId) {
        console.log('������: ����������� ���������');
        return res.status(400).json({ message: '���� ����� ��� ID ����� �� �������' });
    }

    const formattedDate = formatDate(lessonDate);
    //console.log('����������������� ����:', formattedDate);

    // ���������, ���������� �� ��� ���� � ����� �����
    const checkLessonQuery = `
        SELECT lesson_exact_id
        FROM lesson_exact
        WHERE lesson_exact_lesson_id = ? AND lesson_exact_data = ?;
    `;

    db.query(checkLessonQuery, [lessonId, formattedDate], (err, checkResult) => {
        if (err) {
            console.error('������ �������� ������������� �����:', err);
            return res.status(500).json({ message: '������ �� �������' });
        }

        if (checkResult.length > 0) {
            console.log('������: ���� � ����� ����� ��� ����������');
            return res.status(400).json({ message: '���� � ����� ����� ��� ����������' });
        }

        // ��������� ����� ���� ����� � ������� lesson_exact
        const insertLessonQuery = `
            INSERT INTO lesson_exact (lesson_exact_lesson_id, lesson_exact_data)
            VALUES (?, ?);
        `;

        db.query(insertLessonQuery, [lessonId, formattedDate], (err, insertResult) => {
            if (err) {
                console.error('������ ���������� ���� �����:', err);
                return res.status(500).json({ message: '������ �� �������' });
            }

            console.log('���� ����� ������� ���������');
            res.status(200).json({ success: true, message: '���� ����� ������� ���������' });
        });
    });
};


exports.getLessonsByGroup = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: '�� �� ������������' });
    }

    const token = authHeader.split(' ')[1];
    let userId;

    try {
        const decoded = jwt.verify(token, 'secret_key');
        userId = decoded.userId;
    } catch (error) {
        return res.status(403).json({ message: '�������� �����' });
    }

    const { groupName } = req.query; // �������� �������� ������ �� �������

    if (!groupName) {
        return res.status(400).json({ message: '�� ������� �������� ������' });
    }

    // �������� group_id �� �������� ������
    const getGroupIdQuery = `SELECT group_id FROM groups WHERE group_name = ?`;

    db.query(getGroupIdQuery, [groupName], (err, result) => {
        if (err) {
            console.error('������ ��� ��������� group_id:', err);
            return res.status(500).json({ message: '������ �� �������' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: '������ �� �������' });
        }

        const groupId = result[0].group_id;

        // ����������� SQL-������ � JOIN
        const getLessonsQuery = `
            SELECT 
                l.lesson_id, 
                d.day_name,  -- �������� �������� ���
                l.lesson_start, 
                l.lesson_end 
            FROM lesson l
            JOIN day d ON l.lesson_day_id = d.day_id
            WHERE l.lesson_group_id = ?;
        `;

        db.query(getLessonsQuery, [groupId], (err, lessons) => {
            if (err) {
                console.error('������ ��� ��������� ������:', err);
                return res.status(500).json({ message: '������ �� �������' });
            }

            res.status(200).json({ lessons });
        });
    });
};

// �������� ����� �� ����
exports.deleteLessonDate = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: '�� �� ������������' });
    }

    const token = authHeader.split(' ')[1];
    let userId;

    try {
        const decoded = jwt.verify(token, 'secret_key');
        userId = decoded.userId;
    } catch (error) {
        return res.status(403).json({ message: '�������� �����' });
    }

    const { lessonDate, group } = req.body;

    if (!lessonDate || !group) {
        return res.status(400).json({ message: '���� ����� ��� ������ �� �������' });
    }

    const formattedDate = formatDate(lessonDate);

    // ������ � �������� ������������ ��� ����� �����
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
            console.error('������ ��� �������� ������������:', err);
            return res.status(500).json({ message: '������ �� �������' });
        }

        // ������ ������ ��� ���� �� ������� lesson_exact
        const deleteLessonQuery = `
            DELETE le
            FROM lesson_exact le
            JOIN lesson l ON le.lesson_exact_lesson_id = l.lesson_id
            JOIN groups g ON l.lesson_group_id = g.group_id
            WHERE DATE(le.lesson_exact_data) = ? AND g.group_name = ?;
        `;

        db.query(deleteLessonQuery, [formattedDate, group], (err, result) => {
            if (err) {
                console.error('������ ��� �������� �����:', err);
                return res.status(500).json({ message: '������ �� �������' });
            }

            // ���� ���� ��� ������� ������
            res.status(200).json({ success: true, message: '���� � ��������� ������ ������� �������' });
        });
    });
};






