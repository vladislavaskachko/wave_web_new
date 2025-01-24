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