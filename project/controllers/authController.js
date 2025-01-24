const db = require('../config/dbConfig');  
exports.login = function (req, res) {
    var login = req.body.login;
    var password = req.body.password;

    if (!login || !password) {
        return res.status(400).json({ message: '������� ����� � ������' });
    }

    db.query(
        'SELECT * FROM users WHERE user_login = ? AND user_password = ?',
        [login, password],
        function (err, results) {
            if (err) {
                console.error('������ ���������� ������� � ���� ������:', err);
                return res.status(500).json({ message: '������ �� �������' });
            }

            if (results.length > 0) {
                return res.status(200).json({
                    message: '�������� ����',
                    token: 'example-token',  
                    fullName: results[0].user_fullname 
                });
            } else {
                return res.status(401).json({ message: '�������� ����� ��� ������' });
            }
        }
    );
};