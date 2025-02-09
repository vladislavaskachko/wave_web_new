const db = require('../config/dbConfig');
const ExcelJS = require('exceljs');

// Получение списка групп
exports.getGroups = (req, res) => {
    const query = 'SELECT * FROM groups';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Ошибка при получении групп:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }
        res.status(200).json(results);
    });
};

// Получение списка студентов в выбранной группе
exports.getStudentsByGroup = (req, res) => {
    const { groupName } = req.params;

    const query = `
        SELECT student.student_id, CONCAT(users.user_surname, ' ', users.user_name, ' ', users.user_patronymic) AS full_name
        FROM student
        JOIN students_groups ON student.student_id = students_groups.student_id
        JOIN groups ON groups.group_id = students_groups.group_id
        JOIN users ON student.student_user_id = users.user_id
        WHERE groups.group_name = ?`;

    db.query(query, [groupName], (err, results) => {
        if (err) {
            console.error('Ошибка при получении студентов:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }
        res.status(200).json(results);
    });
};
exports.getPaymentsForStudent = (req, res) => {
    const { studentId } = req.params;

    const query = `
        SELECT payment.payment_sum, payment.payment_date, payment.payment_details
        FROM payment
        INNER JOIN contract ON payment.payment_contract_id = contract.contract_id
        WHERE contract.contract_student_id = ?`;

    db.query(query, [studentId], (err, results) => {
        if (err) {
            console.error('Ошибка при получении платежей:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }
        res.status(200).json(results);
    });
};

// Добавление платежа
exports.addPayment = (req, res) => {
    const { groupName, studentName, studentSurname, amount, chequeNumber, date } = req.body;

    let groupId, studentId;

    const getGroupId = 'SELECT group_id FROM groups WHERE group_name = ?';
    db.query(getGroupId, [groupName], (err, result) => {
        if (err || result.length === 0) {
            return res.status(400).json({ message: 'Группа не найдена' });
        }
        groupId = result[0].group_id;

        const getStudentId = `
            SELECT student_id FROM student 
            JOIN users ON student.student_user_id = users.user_id 
            WHERE users.user_name = ? AND users.user_surname = ?`;

        db.query(getStudentId, [studentName, studentSurname], (err, result) => {
            if (err || result.length === 0) {
                return res.status(400).json({ message: 'Студент не найден' });
            }
            studentId = result[0].student_id;

            const getContractId = `
                SELECT contract_id FROM contract 
                WHERE contract_student_id = ? AND contract_course_id = ?`;

            db.query(getContractId, [studentId, groupId], (err, result) => {
                if (err || result.length === 0) {
                    return res.status(400).json({ message: 'Контракт не найден' });
                }
                const contractId = result[0].contract_id;

                const insertPayment = `
                    INSERT INTO payment (payment_contract_id, payment_sum, payment_date, payment_details) 
                    VALUES (?, ?, ?, ?)`;

                db.query(insertPayment, [contractId, amount, date, chequeNumber], (err) => {
                    if (err) {
                        console.error('Ошибка при добавлении платежа:', err);
                        return res.status(500).json({ message: 'Ошибка на сервере' });
                    }
                    res.status(201).json({ message: 'Платеж успешно добавлен' });
                });
            });
        });
    });
};

// Экспорт платежей в Excel
exports.exportPaymentsToExcel = (req, res) => {
    const { groupName } = req.params;

    const query = `
        SELECT CONCAT(users.user_surname, ' ', users.user_name) AS full_name, 
               payment.payment_sum, payment.payment_details, payment.payment_date
        FROM payment
        INNER JOIN contract ON payment.payment_contract_id = contract.contract_id
        INNER JOIN student ON contract.contract_student_id = student.student_id
        INNER JOIN users ON student.student_user_id = users.user_id
        INNER JOIN groups ON contract.contract_course_id = groups.group_id
        WHERE groups.group_name = ?`;

    db.query(query, [groupName], async (err, results) => {
        if (err) {
            console.error('Ошибка при выгрузке данных:', err);
            return res.status(500).json({ message: 'Ошибка на сервере' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Платежи');

        worksheet.columns = [
            { header: 'ФИО', key: 'full_name', width: 30 },
            { header: 'Сумма платежа', key: 'payment_sum', width: 15 },
            { header: 'Детали платежа', key: 'payment_details', width: 20 },
            { header: 'Дата платежа', key: 'payment_date', width: 15 }
        ];

        results.forEach(row => worksheet.addRow(row));

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${groupName}_payments.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    });
};