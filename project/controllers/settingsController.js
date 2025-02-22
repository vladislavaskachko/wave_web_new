var db = require('../config/dbConfig'); 

exports.getSchemes = (req, res) => {
    db.query('SELECT * FROM scheme', (err, results) => {
        if (err) {
            console.error('Ошибка при получении данных размеров:', err);
            return res.status(500).json({ message: 'Ошибка сервера', error: err });
        }
        res.status(200).json(results);
    });
};

exports.addScheme = (req, res) => {
    const { scheme_value } = req.body;
    if (!scheme_value) {
        return res.status(400).send('Поле scheme_value обязательно');
    }

    db.query('INSERT INTO scheme (scheme_value) VALUES (?)', [scheme_value], (err) => {
        if (err) {
            return res.status(500).send('Ошибка при добавлении записи');
        }
        res.redirect('/api/settings/schemes');
    });
};

exports.deleteScheme = (req, res) => {
    const { scheme_id } = req.params;
    db.query('DELETE FROM scheme WHERE scheme_id = ?', [scheme_id], (err) => {
        if (err) {
            return res.status(500).send('Ошибка при удалении записи');
        }
        res.redirect('/api/settings/schemes');
    });
};

exports.getSizes = (req, res) => {
    db.query('SELECT * FROM size', (err, results) => {
        if (err) {
            console.error('Ошибка при получении данных размеров:', err);
            return res.status(500).json({ message: 'Ошибка сервера', error: err });
        }
        res.status(200).json(results);
    });
};

exports.addSize = (req, res) => {
    const { size_value } = req.body;
    if (!size_value) {
        return res.status(400).send('Поле size_value обязательно');
    }

    db.query('INSERT INTO size (size_value) VALUES (?)', [size_value], (err) => {
        if (err) {
            return res.status(500).send('Ошибка при добавлении записи');
        }
        res.redirect('/api/settings/sizes');
    });
};


exports.deleteSize = (req, res) => {
    const { size_id } = req.params;
    db.query('DELETE FROM size WHERE size_id = ?', [size_id], (err) => {
        if (err) {
            return res.status(500).send('Ошибка при удалении записи');
        }
        res.redirect('/api/settings/sizes');
    });
}; 

