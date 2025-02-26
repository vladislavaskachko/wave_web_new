const db = require('../config/dbConfig');

exports.getParents = (req, res) => {
    db.query(`
        SELECT u.user_id, u.user_surname, u.user_name, u.user_patronymic
        FROM users u
        JOIN users_types ut ON u.user_id = ut.users_id
        WHERE ut.users_type_id = 4
    `, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};
