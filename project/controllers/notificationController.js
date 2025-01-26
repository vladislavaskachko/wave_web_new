var db = require('../config/dbConfig'); 

exports.getNotifications = function (req, res) {
    db.query(
        'SELECT notification_text, notification_date FROM notification ORDER BY notification_date DESC;',
        function (err, results) {
            if (err) {
                console.error('������ ���������� ������� � ���� ������:', err);
                return res.status(500).json({ message: '������ �� �������' });
            }
            return res.status(200).json(results);
        }
    );
};
exports.addNotification = function (req, res) {
    const { notification_text, notification_date } = req.body;

    if (!notification_text || notification_text.trim() === "") {
        return res.status(400).json({ message: "����� ����������� ����������" });
    }

    if (!notification_date || isNaN(new Date(notification_date).getTime())) {
        return res.status(400).json({ message: "������������ ���� �����������" });
    }

    const formattedDate = new Date(notification_date);

    db.query(
        'INSERT INTO notification (notification_text, notification_date) VALUES (?, ?)',
        [notification_text, formattedDate],
        function (err, results) {
            if (err) {
                console.error('������ ���������� ������� � ���� ������:', err);
                return res.status(500).json({ message: '������ �� �������' });
            }
            return res.status(201).json({ message: "����������� ��������� �������" });
        }
    );
};