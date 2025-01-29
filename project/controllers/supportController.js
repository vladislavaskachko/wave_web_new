const db = require('../config/dbConfig');

exports.getSupport = (req, res) => {
    const query = `
        SELECT q.question_id, q.question_section_id, q.question_text, q.question_answer, s.section_name
        FROM question q
        INNER JOIN section s ON q.question_section_id = s.section_id
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Ошибка выполнения запроса к базе данных:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }

        // Формируем структуру данных для ответа
        const questions = results.map(row => ({
            id: row.question_id,
            section: row.section_name,
            text: row.question_text,
            answer: row.question_answer
        }));

        const sections = [...new Set(questions.map(q => q.section))];

        res.status(200).json({ sections, questions });
    });
};
