const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');

exports.getGrades = (req, res) => {
    // Проверяем заголовок авторизации
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Вы не авторизованы' });
    }

    // Извлекаем токен и проверяем его
    const token = authHeader.split(' ')[1];
    let userId;
    try {
        const decoded = jwt.verify(token, 'secret_key'); // Используйте тот же ключ, что и при авторизации
        userId = decoded.userId;
    } catch (error) {
        return res.status(403).json({ message: 'Неверный токен' });
    }

    // Получаем studentId из query-параметров
    const studentId = req.query.studentId;
    if (!studentId) {
        return res.status(400).json({ message: 'Не указан идентификатор ученика' });
    }

    // Проверяем, что ученик принадлежит родителю
    const getParentIdQuery = `SELECT parent_id FROM parent WHERE parent_user_id = ?`;
    db.query(getParentIdQuery, [userId], (err, parentResults) => {
        if (err) {
            console.error('Ошибка запроса к базе данных:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }
        if (parentResults.length === 0) {
            return res.status(404).json({ message: 'Родитель не найден' });
        }

        const parentId = parentResults[0].parent_id;
        const checkStudentQuery = `SELECT student_id FROM student WHERE student_id = ? AND student_parent_id = ?`;
        db.query(checkStudentQuery, [studentId, parentId], (err, studentResults) => {
            if (err) {
                console.error('Ошибка запроса к базе данных:', err);
                return res.status(500).json({ message: 'Ошибка на сервере' });
            }
            if (studentResults.length === 0) {
                return res.status(404).json({ message: 'Указанный ученик не найден' });
            }

            // Запрос для получения оценок ученика (аналогичный тому, что используется для студента)
            const gradesQuery = `
        SELECT 
          test.test_name AS testName, 
          DATE_FORMAT(test.test_date, '%d.%m.%Y') AS testDate, 
          test_visit.test_visit AS attended, 
          groups.group_name AS groupName, 
          test_visit.test_visit_mark AS grade
        FROM test
        JOIN test_visit 
          ON test_visit.test_visit_student_id = ? 
          AND test_visit.test_visit_test_id = test.test_id
        JOIN groups 
          ON test.test_group_id = groups.group_id
        ORDER BY test.test_date DESC;
      `;

            db.query(gradesQuery, [studentId], (err, results) => {
                if (err) {
                    console.error('Ошибка запроса к базе данных:', err);
                    return res.status(500).json({ message: 'Ошибка на сервере' });
                }

                // Если оценок нет, возвращаем пустой массив
                if (results.length === 0) {
                    return res.status(200).json({ grades: [] });
                }

                // Форматируем результаты
                const grades = results.map(row => ({
                    testName: row.testName,
                    testDate: row.testDate,
                    grade: row.grade,
                    attended: row.attended,
                    group: row.groupName
                }));

                res.status(200).json({ grades });
            });
        });
    });
};
