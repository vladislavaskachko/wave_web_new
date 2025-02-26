const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig'); // Настройка подключения к базе данных

exports.getGrades = (req, res) => {
    // Получаем заголовок авторизации
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Вы не авторизованы' });
    }

    // Извлекаем токен из заголовка (формат "Bearer <token>")
    const token = authHeader.split(' ')[1];
    let userId;

    // Проверяем токен
    try {
        const decoded = jwt.verify(token, 'secret_key'); // Используйте тот же секретный ключ, что и при генерации токена
        userId = decoded.userId;
    } catch (error) {
        return res.status(403).json({ message: 'Неверный токен' });
    }

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



    // Выполняем запрос к базе данных
    db.query(gradesQuery, [userId], (err, results) => {
        if (err) {
            console.error('Ошибка запроса к базе данных:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }

        // Если оценок нет, возвращаем пустой массив
        if (results.length === 0) {
            return res.status(200).json({ grades: [] });
        }

        // Форматируем результаты и отправляем ответ
        const grades = results.map(row => ({
            testName: row.testName,
            testDate: row.testDate,
            grade: row.grade,
            attended: row.attended,
            group: row.groupName
        }));

        res.status(200).json({ grades });
    });
};
