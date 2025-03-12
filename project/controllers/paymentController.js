const db = require('../config/dbConfig');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');


// ���������� �������
exports.addPayment = (req, res) => {
    const { groupName, studentName, studentSurname, amount, chequeNumber, date } = req.body;

    let groupId, studentId, contractId;

    const getGroupId = () => {
        return new Promise((resolve, reject) => {
            db.query('SELECT group_id FROM groups WHERE group_name = ?', [groupName], (err, results) => {
                if (err) return reject(err);
                groupId = results[0].group_id;
                resolve();
            });
        });
    };

    const getStudentId = () => {
        return new Promise((resolve, reject) => {
            db.query('SELECT student_id FROM student JOIN users ON student.student_user_id = users.user_id WHERE users.user_name = ? AND users.user_surname = ?', [studentName, studentSurname], (err, results) => {
                if (err) return reject(err);
                studentId = results[0].student_id;
                resolve();
            });
        });
    };
    const getContractId = () => {
        return new Promise((resolve, reject) => {
            // ������� �������� course_id �� group_id
            db.query('SELECT group_course_id FROM groups WHERE group_id = ?', [groupId], (err, results) => {
                if (err) return reject(err);
                if (results.length === 0) return reject(new Error('���� ��� ������ ������ �� ������'));

                const courseId = results[0].group_course_id;

                // ������ ���� �������� �� contract_course_id = courseId
                db.query('SELECT contract_id FROM contract WHERE contract_student_id = ? AND contract_course_id = ?', [studentId, courseId], (err, results) => {
                    if (err) return reject(err);
                    if (results.length === 0) return reject(new Error('�������� �� ������'));

                    contractId = results[0].contract_id;
                    resolve();
                });
            });
        });
    };

    const addPayment = () => {
        return new Promise((resolve, reject) => {
            db.query('INSERT INTO payment (payment_contract_id, payment_sum, payment_date, payment_details) VALUES (?, ?, ?, ?)', [contractId, amount, date, chequeNumber], (err, results) => {
                if (err) return reject(err);
                resolve();
            });
        });
    };

    getGroupId()
        .then(getStudentId)
        .then(getContractId)
        .then(addPayment)
        .then(() => {
            return res.status(201).json({ message: '������ ������� ��������' });
        })
        .catch(err => {
            console.error('������ ��� ���������� �������:', err);
            return res.status(500).json({ message: '������ �� �������' });
        });
};

// ������� �������� � Excel
exports.exportPayments = (req, res) => {
    const groupName = req.params.groupName;
    const date = new Date().toISOString().split('T')[0];
    const fileName = `${groupName}_payments_${date}.xlsx`;
    const filePath = path.join(__dirname, '..', 'exports', fileName);

    const query = `
        SELECT payment_sum, payment_details, payment_date
        FROM payment
        INNER JOIN contract ON payment.payment_contract_id = contract.contract_id
        INNER JOIN groups ON contract.contract_course_id = groups.group_id
        WHERE groups.group_name = ?`;

    db.query(query, [groupName], (err, results) => {
        if (err) {
            console.error('������ ���������� ������� � ���� ������:', err);
            return res.status(500).json({ message: '������ �� �������' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('�������');

        worksheet.columns = [
            { header: '����� �������', key: 'payment_sum', width: 15 },
            { header: '����� ����', key: 'payment_details', width: 15 },
            { header: '���� �������', key: 'payment_date', width: 15 }
        ];

        results.forEach(row => {
            worksheet.addRow(row);
        });

        workbook.xlsx.writeFile(filePath)
            .then(() => {
                res.download(filePath, fileName, (err) => {
                    if (err) {
                        console.error('������ ��� ���������� �����:', err);
                        return res.status(500).json({ message: '������ ��� ���������� �����' });
                    }
                    fs.unlinkSync(filePath); // �������� ����� ����� ��������
                });
            })
            .catch(err => {
                console.error('������ ��� �������� Excel �����:', err);
                return res.status(500).json({ message: '������ ��� �������� Excel �����' });
            });
    });
};

// ��������� ���������� � ����� � �������� ��� ��������
exports.getCourseAndPaymentsInfo = (req, res) => {
    const { studentName, studentSurname } = req.params;

    const query = `
        SELECT c.course_name, c.course_price, c.course_time, s.scheme_value, con.contract_sale
        FROM course c
        JOIN contract con ON c.course_id = con.contract_course_id
        JOIN scheme s ON s.scheme_id = c.course_scheme_id
        JOIN student st ON st.student_id = con.contract_student_id
        JOIN users u ON u.user_id = st.student_user_id
        WHERE u.user_name = ? AND u.user_surname = ?`;

    db.query(query, [studentName, studentSurname], (err, results) => {
        if (err) {
            console.error('������ ���������� ������� � ���� ������:', err);
            return res.status(500).json({ message: '������ �� �������' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: '���������� � ����� � �������� �� �������' });
        }

        const courseInfo = results[0];
        const totalPrice = courseInfo.contract_sale > 0
            ? courseInfo.course_price * courseInfo.course_time - courseInfo.contract_sale
            : courseInfo.course_price * courseInfo.course_time;
        const singlePayment = totalPrice / courseInfo.scheme_value;

        return res.status(200).json({
            courseName: courseInfo.course_name,
            totalPrice,
            singlePayment
        });
    });
};
exports.getStudentPayments = (req, res) => {
    const { studentName, studentSurname } = req.params;

    const query = `
        SELECT p.payment_sum, p.payment_date, p.payment_details
        FROM payment p
        JOIN contract con ON p.payment_contract_id = con.contract_id
        JOIN student s ON s.student_id = con.contract_student_id
        JOIN users u ON u.user_id = s.student_user_id
        WHERE u.user_name = ? AND u.user_surname = ?
        ORDER BY p.payment_date DESC
    `;

    db.query(query, [studentName, studentSurname], (err, results) => {
        if (err) {
            console.error('������ ������� � ���� ������:', err);
            return res.status(500).json({ message: '������ �� �������' });
        }

        return res.status(200).json(results);
    });
};