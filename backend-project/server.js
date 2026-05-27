const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db.js');
const app = express();
const api = express.Router();
const port = 3000;
const session = require('express-session');
const cors = require('cors');

const corsOrigins = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://web.postman.co',
    'https://app.postman.com',
]);

app.use(cors({
    origin(origin, callback) {
        if (!origin) {
            return callback(null, true);
        }
        if (corsOrigins.has(origin)) {
            return callback(null, true);
        }
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
}));

app.use(express.json());

app.use(session({
    secret: 'password',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false
    }
}));

function normalizeRole(role) {
    if (!role) return 'customer';
    const cleanRole = String(role).toLowerCase();
    return cleanRole === 'manager' ? 'manager' : 'customer';
}

// user(userID, fullname, email, phone, password, role)
async function createUser(req, res) {
    const fullname = req.body.fullname || req.body.userName;
    const email = req.body.email || req.body.userName;
    const phone = req.body.phone || '';
    const password = req.body.password;
    const role = normalizeRole(req.body.role || req.body.userRole);

    if (!fullname || !email || !password) {
        return res.status(400).json({ error: 'fullname, email and password are required' });
    }

    const sql = 'INSERT INTO `user`(fullname,email,phone,password,role) VALUES(?,?,?,?,?)';
    try {
        const [existing] = await db.execute('SELECT userID FROM `user` WHERE email=?', [email]);
        if (existing.length) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute(sql, [fullname, email, phone, hashedPassword, role]);
        res.status(201).json({ message: 'user created' });
    } catch (err) {
        console.error('create user error:', err);
        res.status(500).json({ error: 'error when creating' });
    }
}

async function getUser(req, res) {
    const email = req.body.email || req.body.userName;
    const password = req.body.password;
    const role = req.body.role || req.body.userRole;
    let sql = 'SELECT * FROM `user` WHERE email=?';
    const params = [email];

    if (role) {
        sql += ' AND role=?';
        params.push(normalizeRole(role));
    }

    try {
        const [rows] = await db.execute(sql, params);
        if (!rows.length) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.status(200).json([{ userID: user.userID, fullname: user.fullname, email: user.email, role: user.role }]);
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Retrieving error' });
    }
}

async function login(req, res) {
    const email = req.body.email || req.body.userName;
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
    }

    const sql = 'SELECT * FROM `user` WHERE email=?';
    try {
        const [rows] = await db.execute(sql, [email]);
        if (rows.length > 0) {
            const user = rows[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.session.user = {
                    id: user.userID,
                    fullname: user.fullname,
                    email: user.email,
                    role: user.role
                };
                res.status(200).json({
                    message: 'Login successful',
                    user: req.session.user
                });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'DB error' });
    }
}

function sessionUser(req, res) {
    if (req.session.user) {
        return res.json({ user: req.session.user });
    }
    res.status(401).json({ error: 'Unauthorized' });
}

async function getBuses(req, res) {
    try {
        const [rows] = await db.execute('SELECT * FROM buses ORDER BY busID');
        res.json(rows);
    } catch (err) {
        console.error('getBuses:', err);
        res.status(500).json({ error: 'Failed to list buses' });
    }
}

async function updateBus(req, res) {
    const id = req.params.id;
    const { plateNumber, total_seat } = req.body;
    try {
        await db.execute(
            'UPDATE buses SET plateNumber=?,total_seat=? WHERE busID=?',
            [plateNumber, total_seat, id]
        );
        res.json({ message: 'bus updated' });
    } catch (err) {
        console.error('updateBus:', err);
        res.status(500).json({ error: 'Failed to update bus' });
    }
}

async function deleteBus(req, res) {
    const id = req.params.id;
    try {
        await db.execute('DELETE FROM buses WHERE busID=?', [id]);
        res.json({ message: 'bus deleted' });
    } catch (err) {
        console.error('deleteBus:', err);
        res.status(500).json({ error: 'Failed to delete bus' });
    }
}

async function buses(req, res) {
    const { plateNumber, total_seat } = req.body;
    const sql = 'INSERT INTO buses(plateNumber,total_seat) VALUES(?,?)';
    try {
        await db.execute(sql, [plateNumber, total_seat]);
        res.status(200).json({ message: 'Added to buses' });
    } catch (err) {
        console.error('post error:', err);
        res.status(500).json({ error: 'Error when adding buses' });
    }
}

async function getRoutes(req, res) {
    try {
        const [rows] = await db.execute('SELECT * FROM `Route` ORDER BY routeID');
        res.json(rows);
    } catch (err) {
        console.error('getRoutes:', err);
        res.status(500).json({ error: 'Failed to list routes' });
    }
}

async function updateRoute(req, res) {
    const id = req.params.id;
    const { source, destination, price } = req.body;
    try {
        await db.execute(
            'UPDATE `Route` SET source=?,destination=?,price=? WHERE routeID=?',
            [source, destination, price, id]
        );
        res.json({ message: 'route updated' });
    } catch (err) {
        console.error('updateRoute:', err);
        res.status(500).json({ error: 'Failed to update route' });
    }
}

async function deleteRoute(req, res) {
    const id = req.params.id;
    try {
        await db.execute('DELETE FROM `Route` WHERE routeID=?', [id]);
        res.json({ message: 'route deleted' });
    } catch (err) {
        console.error('deleteRoute:', err);
        res.status(500).json({ error: 'Failed to delete route' });
    }
}

async function routes(req, res) {
    const { source, destination, price } = req.body;
    const sql = 'INSERT INTO `Route`(source,destination,price) VALUES(?,?,?)';
    try {
        await db.execute(sql, [source, destination, price]);
        res.status(200).json({ message: 'route added' });
    } catch (err) {
        console.error('route error:', err);
        res.status(500).json({ error: 'Failed to add route' });
    }
}

async function getSchedules(req, res) {
    try {
        const [rows] = await db.execute(`
            SELECT s.*, b.plateNumber, b.total_seat,
                   r.source, r.destination, r.price
            FROM \`schedule\` s
            LEFT JOIN buses b ON b.busID = s.busID
            LEFT JOIN \`Route\` r ON r.routeID = s.routeID
            ORDER BY s.schID
        `);
        res.json(rows);
    } catch (err) {
        console.error('getSchedule:', err);
        res.status(500).json({ error: 'Failed to list schedule' });
    }
}

async function updateSchedule(req, res) {
    const id = req.params.id;
    const { busID, routeID, departure_time } = req.body;
    try {
        await db.execute(
            'UPDATE `schedule` SET busID=?,routeID=?,departure_time=? WHERE schID=?',
            [busID, routeID, departure_time, id]
        );
        res.json({ message: 'schedule updated' });
    } catch (err) {
        console.error('updateSchedule:', err);
        res.status(500).json({ error: 'Failed to update schedule' });
    }
}

async function deleteSchedule(req, res) {
    const id = req.params.id;
    try {
        await db.execute('DELETE FROM `schedule` WHERE schID=?', [id]);
        res.json({ message: 'schedule deleted' });
    } catch (err) {
        console.error('deleteSchedule:', err);
        res.status(500).json({ error: 'Failed to delete schedule' });
    }
}

async function schedules(req, res) {
    const { busID, routeID, departure_time } = req.body;
    const sql = 'INSERT INTO `schedule`(busID,routeID,departure_time) VALUES (?,?,?)';
    try {
        await db.execute(sql, [busID, routeID, departure_time]);
        res.status(200).json({ message: 'schedule added' });
    } catch (err) {
        console.error('schedule error:', err);
        res.status(500).json({ error: 'Failed to add schedule' });
    }
}

async function bookPassenger(req, res) {
    const { customerName, schID, seatNumber } = req.body;
    const sql = 'INSERT INTO ticket(customerName,schID,seatNumber) VALUES(?,?,?)';
    try {
        const [existing] = await db.execute(
            'SELECT ticketID FROM ticket WHERE schID=? AND seatNumber=?',
            [schID, seatNumber]
        );
        if (existing.length) {
            return res.status(409).json({ error: 'Seat already booked' });
        }

        await db.execute(sql, [customerName, schID, seatNumber]);
        res.status(201).json({ message: 'Booking successful' });
    } catch (err) {
        console.error('booking error:', err);
        res.status(500).json({ error: 'Failed to book passenger' });
    }
}

async function getBookings(req, res) {
    try {
        const [rows] = await db.execute(`
            SELECT t.*, s.departure_time,
                   b.plateNumber, b.total_seat,
                   r.source, r.destination, r.price
            FROM ticket t
            LEFT JOIN \`schedule\` s ON s.schID = t.schID
            LEFT JOIN buses b ON b.busID = s.busID
            LEFT JOIN \`Route\` r ON r.routeID = s.routeID
            ORDER BY t.ticketID DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('getBookings:', err);
        res.status(500).json({ error: 'Failed to list bookings' });
    }
}

async function getBookedSeats(req, res) {
    try {
        const [rows] = await db.execute('SELECT seatNumber FROM ticket WHERE schID=?', [req.params.schID]);
        res.json(rows.map((row) => row.seatNumber));
    } catch (err) {
        console.error('getBookedSeats:', err);
        res.status(500).json({ error: 'Failed to list booked seats' });
    }
}

async function deleteBooking(req, res) {
    const id = req.params.id;
    try {
        await db.execute('DELETE FROM ticket WHERE ticketID=?', [id]);
        res.json({ message: 'booking deleted' });
    } catch (err) {
        console.error('deleteBooking:', err);
        res.status(500).json({ error: 'Failed to delete booking' });
    }
}

async function searchSchedules(req, res) {
    const { source, destination, date } = req.query;
    try {
        let sql = `
            SELECT s.*, b.plateNumber, b.total_seat,
                   r.source, r.destination, r.price
            FROM \`schedule\` s
            LEFT JOIN buses b ON b.busID = s.busID
            LEFT JOIN \`Route\` r ON r.routeID = s.routeID
            WHERE 1=1
        `;
        const params = [];

        if (source) {
            sql += ' AND r.source=?';
            params.push(source);
        }
        if (destination) {
            sql += ' AND r.destination=?';
            params.push(destination);
        }
        if (date) {
            sql += ' AND DATE(s.departure_time)=?';
            params.push(date);
        }

        sql += ' ORDER BY s.departure_time';
        const [rows] = await db.execute(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('searchSchedules:', err);
        res.status(500).json({ error: 'Search failed' });
    }
}

async function logout(req, res) {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not logout' });
        }
        res.status(200).json({ message: 'Logged out successfully' });
    });
}

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Swift Fleet backend running', port });
});

app.post('/users', createUser);
app.post('/getuser', getUser);
app.post('/login', login);
app.get('/session', sessionUser);
app.post('/logout', logout);

// These aliases keep the React frontend and Postman tests working.
app.post('/api/register', createUser);
app.post('/api/login', login);
app.get('/api/session', sessionUser);
app.post('/api/logout', logout);

app.get('/buses', getBuses);
app.post('/bus', buses);
app.put('/buses/:id', updateBus);
app.delete('/buses/:id', deleteBus);

app.get('/routes', getRoutes);
app.post('/route', routes);
app.put('/routes/:id', updateRoute);
app.delete('/routes/:id', deleteRoute);

app.get('/schedules', getSchedules);
app.post('/scheduling', schedules);
app.put('/schedules/:id', updateSchedule);
app.delete('/schedules/:id', deleteSchedule);

app.get('/bookings', getBookings);
app.post('/bookings', bookPassenger);
app.delete('/bookings/:id', deleteBooking);

app.get('/tickets', getBookings);
app.post('/tickets', bookPassenger);
app.get('/tickets/schedule/:schID', getBookedSeats);
app.delete('/tickets/:id', deleteBooking);

app.get('/search', searchSchedules);

app.get('/api/buses', getBuses);
app.post('/api/buses', buses);
app.put('/api/buses/:id', updateBus);
app.delete('/api/buses/:id', deleteBus);

app.get('/api/routes', getRoutes);
app.post('/api/routes', routes);
app.put('/api/routes/:id', updateRoute);
app.delete('/api/routes/:id', deleteRoute);

app.get('/api/schedules', getSchedules);
app.post('/api/schedules', schedules);
app.put('/api/schedules/:id', updateSchedule);
app.delete('/api/schedules/:id', deleteSchedule);

app.get('/api/bookings', getBookings);
app.post('/api/bookings', bookPassenger);
app.delete('/api/bookings/:id', deleteBooking);

app.get('/api/tickets', getBookings);
app.post('/api/tickets', bookPassenger);
app.get('/api/tickets/schedule/:schID', getBookedSeats);
app.delete('/api/tickets/:id', deleteBooking);

app.get('/api/search', searchSchedules);

app.use('/api', api);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});