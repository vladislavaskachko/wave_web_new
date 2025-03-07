const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');

exports.getTestsByGroup = (req, res) => {
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

    const group = req.query.group;
    if (!group) {
        return res.status(400).json({ message: 'Группа не указана' });
    }

    const testsQuery = `
    SELECT test.test_id, test.test_name
    FROM test
    JOIN groups ON test.test_group_id = groups.group_id
    JOIN teacher ON groups.group_teacher_id = teacher.teacher_id
    JOIN users ON teacher.teacher_user_id = users.user_id
    WHERE groups.group_name = ? AND users.user_id = ?
    ORDER BY test.test_date DESC;
  `;

    db.query(testsQuery, [group, userId], (err, results) => {
        if (err) {
            console.error('Ошибка запроса к базе данных:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }
        res.status(200).json({ tests: results });
    });
};

exports.getGrades = (req, res) => {
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

    const teacherGradesQuery = `
        SELECT 
            CONCAT(u.user_surname, ' ', u.user_name, ' ', u.user_patronymic) AS studentName,
            t.test_name AS testName,
            t.test_id AS testId,
            DATE_FORMAT(t.test_date, '%d.%m.%Y') AS testDate, 
            tv.test_visit AS attended, 
            tv.test_visit_mark AS grade,
            g.group_name AS groupName
        FROM teacher AS teach
        JOIN groups AS g ON g.group_teacher_id = teach.teacher_id
        JOIN students_groups AS sg ON sg.group_id = g.group_id
        JOIN student AS s ON s.student_id = sg.student_id
        JOIN users AS u ON s.student_user_id = u.user_id
        JOIN test AS t ON t.test_group_id = g.group_id
        LEFT JOIN test_visit AS tv 
            ON tv.test_visit_test_id = t.test_id 
            AND tv.test_visit_student_id = s.student_id
        WHERE teach.teacher_user_id = ?
        ORDER BY u.user_surname ASC, u.user_name ASC, u.user_patronymic ASC, t.test_date DESC;
    `;

    db.query(teacherGradesQuery, [userId], (err, results) => {
        if (err) {
            console.error('Ошибка запроса к базе данных:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }

        if (results.length === 0) {
            return res.status(200).json({ grades: [] });
        }

        const grades = results.map(row => ({
            studentName: row.studentName,
            testName: row.testName,
            testId: row.testId,
            testDate: row.testDate,
            attended: row.attended,
            grade: row.grade,
            group: row.groupName
        }));

        res.status(200).json({ grades });
    });
};


exports.getStudents = (req, res) => {
    // Получаем заголовок авторизации
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Вы не авторизованы' });
    }

    // Извлекаем токен из заголовка
    const token = authHeader.split(' ')[1];
    let userId;

    // Проверяем токен
    try {
        const decoded = jwt.verify(token, 'secret_key'); // Используйте актуальный секретный ключ
        userId = decoded.userId;
    } catch (error) {
        return res.status(403).json({ message: 'Неверный токен' });
    }

    // SQL-запрос для получения списка учеников, привязанных к группам преподавателя
    const studentsQuery = `
        SELECT 
            s.student_id AS studentId,
            CONCAT(u.user_surname, ' ', u.user_name, ' ', u.user_patronymic) AS studentName,
            g.group_name AS groupName
        FROM teacher AS teach
        JOIN groups AS g ON g.group_teacher_id = teach.teacher_id
        JOIN students_groups AS sg ON sg.group_id = g.group_id
        JOIN student AS s ON s.student_id = sg.student_id
        JOIN users AS u ON s.student_user_id = u.user_id
        WHERE teach.teacher_user_id = ?
        ORDER BY g.group_name, u.user_surname;
    `;

    db.query(studentsQuery, [userId], (err, results) => {
        if (err) {
            console.error('Ошибка запроса к базе данных:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }

        res.status(200).json({ students: results });
    });
};

exports.deleteTest = (req, res) => {
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

    const { testId } = req.body;
    if (!testId) {
        return res.status(400).json({ message: 'testId не указан' });
    }

    const deleteQuery = `
    DELETE FROM test
    WHERE test_id = ?
      AND test_group_id IN (
        SELECT group_id FROM groups 
        WHERE group_teacher_id = (SELECT teacher_id FROM teacher WHERE teacher_user_id = ?)
      )
  `;
    db.query(deleteQuery, [testId, userId], (err, result) => {
        if (err) {
            console.error('Ошибка удаления теста:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }
        res.status(200).json({ message: 'Тест удалён' });
    });
};

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

exports.createTest = (req, res) => {
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

    const { testName, testDate, testGroup } = req.body;
    /*console.log('Полученные данные:', { testName, testDate, testGroup });*/

    if (!testName || !testDate || !testGroup) {
        return res.status(400).json({ message: 'Не все данные указаны' });
    }

    // Преобразуем дату в правильный формат
    let formattedDate;
    try {
        /*console.log('Дата до форматирования:', testDate);*/
        formattedDate = formatDate(testDate);
        /*console.log('Дата после форматирования:', formattedDate);*/
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }

    // Получаем ID группы
    const groupQuery = `SELECT group_id FROM groups WHERE group_name = ? AND group_teacher_id = (SELECT teacher_id FROM teacher WHERE teacher_user_id = ?)`;
    db.query(groupQuery, [testGroup, userId], (err, groupResults) => {
        if (err) {
            console.error('Ошибка получения группы:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }
        if (groupResults.length === 0) {
            return res.status(404).json({ message: 'Группа не найдена или вы не являетесь её преподавателем' });
        }

        const groupId = groupResults[0].group_id;
        /*console.log('ID группы:', groupId);*/

        // Вставляем новый тест
        const insertTestQuery = `INSERT INTO test (test_name, test_date, test_group_id) VALUES (?, ?, ?)`;
        db.query(insertTestQuery, [testName, formattedDate, groupId], (err, result) => {
            if (err) {
                console.error('Ошибка создания теста:', err);
                return res.status(500).json({ message: 'Ошибка на сервере' });
            }
            res.status(201).json({ message: 'Тест успешно создан', testId: result.insertId });
        });
    });
};

exports.addTestVisit = (req, res) => {
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

    const { testGroupForTest, testId, studentId, attendance, mark } = req.body;

    // Проверка, что все обязательные данные переданы
    if (!testGroupForTest || !testId || !studentId || attendance === undefined) {
        return res.status(400).json({ message: 'Пожалуйста, заполните все обязательные поля' });
    }

    // Преобразование mark в число, если оно передано
    const testMark = mark ? parseInt(mark) : null;

    // Запрос на добавление или обновление посещения теста
    const checkTestVisitQuery = `
        SELECT * FROM test_visit 
        WHERE test_visit_test_id = ? AND test_visit_student_id = ?
    `;

    db.query(checkTestVisitQuery, [testId, studentId], (err, results) => {
        if (err) {
            console.error('Ошибка запроса к базе данных:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }

        if (results.length > 0) {
            // Если запись уже существует, обновляем её
            const updateTestVisitQuery = `
                UPDATE test_visit
                SET test_visit = ?, test_visit_mark = ?
                WHERE test_visit_test_id = ? AND test_visit_student_id = ?
            `;
            db.query(updateTestVisitQuery, [attendance, testMark, testId, studentId], (err, updateResult) => {
                if (err) {
                    console.error('Ошибка обновления данных в базе:', err);
                    return res.status(500).json({ message: 'Ошибка на сервере' });
                }
                return res.status(200).json({ message: 'Информация о посещении теста обновлена' });
            });
        } else {
            // Если записи нет, создаём новую
            const insertTestVisitQuery = `
                INSERT INTO test_visit (test_visit_test_id, test_visit_student_id, test_visit, test_visit_mark)
                VALUES (?, ?, ?, ?)
            `;
            db.query(insertTestVisitQuery, [testId, studentId, attendance, testMark], (err, insertResult) => {
                if (err) {
                    console.error('Ошибка добавления данных в базу:', err);
                    return res.status(500).json({ message: 'Ошибка на сервере' });
                }
                return res.status(201).json({ message: 'Информация о посещении теста добавлена' });
            });
        }
    });
};




