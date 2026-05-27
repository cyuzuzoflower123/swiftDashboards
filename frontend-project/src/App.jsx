import { useEffect, useState } from 'react';

const API = 'http://localhost:3000/api';
const input = 'w-full border border-gray-300 rounded px-3 py-2';
const button = 'bg-gray-900 text-white rounded px-3 py-2 hover:bg-gray-800';
const outline = 'border border-gray-300 rounded px-3 py-2 hover:bg-gray-100';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const api = {
  register: (body) => request('/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/logout', { method: 'POST' }),
  session: () => request('/session'),
  buses: () => request('/buses'),
  addBus: (body) => request('/buses', { method: 'POST', body: JSON.stringify(body) }),
  deleteBus: (id) => request(`/buses/${id}`, { method: 'DELETE' }),
  routes: () => request('/routes'),
  addRoute: (body) => request('/routes', { method: 'POST', body: JSON.stringify(body) }),
  deleteRoute: (id) => request(`/routes/${id}`, { method: 'DELETE' }),
  schedules: () => request('/schedules'),
  addSchedule: (body) => request('/schedules', { method: 'POST', body: JSON.stringify(body) }),
  deleteSchedule: (id) => request(`/schedules/${id}`, { method: 'DELETE' }),
  tickets: () => request('/tickets'),
  seats: (id) => request(`/tickets/schedule/${id}`),
  addTicket: (body) => request('/tickets', { method: 'POST', body: JSON.stringify(body) }),
  deleteTicket: (id) => request(`/tickets/${id}`, { method: 'DELETE' }),
  search: (params) => request(`/search?${new URLSearchParams(params)}`),
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.session().then((data) => setUser(data.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  async function logout() {
    await api.logout();
    setUser(null);
  }

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      {user && <Navbar user={user} logout={logout} />}
      {error && <p className="max-w-5xl mx-auto mt-4 bg-red-50 border border-red-200 text-red-700 rounded p-2 text-sm">{error}</p>}
      {!user ? <Login setUser={setUser} setError={setError} /> : user.role === 'manager' ? <Manager setError={setError} /> : <Customer user={user} setError={setError} />}
    </div>
  );
}

function Navbar({ user, logout }) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Swift Fleet</h1>
          <p className="text-sm text-gray-500">Bus ticket reservation</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span>{user.fullname} ({user.role})</span>
          <button className={outline} onClick={logout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}

function Login({ setUser, setError }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ fullname: '', email: '', phone: '', password: '', role: 'customer' });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'register') {
        await api.register(form);
        setMode('login');
      } else {
        const data = await api.login({ email: form.email, password: form.password });
        setUser(data.user);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <section className="w-full max-w-md bg-white border border-gray-200 rounded p-6">
        <h1 className="text-2xl font-bold">Swift Fleet</h1>
        <p className="text-gray-600 mt-1">Login or register.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === 'register' && <>
            <input className={input} placeholder="Full name" value={form.fullname} onChange={(e) => update('fullname', e.target.value)} required />
            <input className={input} placeholder="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
            <select className={input} value={form.role} onChange={(e) => update('role', e.target.value)}>
              <option value="customer">Customer</option>
              <option value="manager">Manager</option>
            </select>
          </>}
          <input className={input} type="email" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          <input className={input} type="password" placeholder="Password" value={form.password} onChange={(e) => update('password', e.target.value)} required />
          <button className={`${button} w-full`}>{mode === 'register' ? 'Create account' : 'Login'}</button>
        </form>
        <button className="mt-4 text-sm text-blue-700 hover:underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
      </section>
    </main>
  );
}

function Manager({ setError }) {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [bus, setBus] = useState({ plateNumber: '', total_seat: '' });
  const [route, setRoute] = useState({ source: '', destination: '', price: '' });
  const [schedule, setSchedule] = useState({ busID: '', routeID: '', departure_time: '' });

  async function load() {
    try {
      const [b, r, s, t] = await Promise.all([api.buses(), api.routes(), api.schedules(), api.tickets()]);
      setBuses(b); setRoutes(r); setSchedules(s); setTickets(t);
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function addBus(e) { e.preventDefault(); await api.addBus(bus); setBus({ plateNumber: '', total_seat: '' }); load(); }
  async function addRoute(e) { e.preventDefault(); await api.addRoute(route); setRoute({ source: '', destination: '', price: '' }); load(); }
  async function addSchedule(e) { e.preventDefault(); await api.addSchedule(schedule); setSchedule({ busID: '', routeID: '', departure_time: '' }); load(); }

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Manager Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <Panel title="Add Bus"><form onSubmit={addBus} className="space-y-3"><input className={input} placeholder="Plate number" value={bus.plateNumber} onChange={(e) => setBus({ ...bus, plateNumber: e.target.value })} required /><input className={input} type="number" placeholder="Total seats" value={bus.total_seat} onChange={(e) => setBus({ ...bus, total_seat: e.target.value })} required /><button className={button}>Save bus</button></form></Panel>
        <Panel title="Add Route"><form onSubmit={addRoute} className="space-y-3"><input className={input} placeholder="Source" value={route.source} onChange={(e) => setRoute({ ...route, source: e.target.value })} required /><input className={input} placeholder="Destination" value={route.destination} onChange={(e) => setRoute({ ...route, destination: e.target.value })} required /><input className={input} type="number" placeholder="Price" value={route.price} onChange={(e) => setRoute({ ...route, price: e.target.value })} required /><button className={button}>Save route</button></form></Panel>
        <Panel title="Add Schedule"><form onSubmit={addSchedule} className="space-y-3"><select className={input} value={schedule.busID} onChange={(e) => setSchedule({ ...schedule, busID: e.target.value })} required><option value="">Select bus</option>{buses.map((b) => <option key={b.busID} value={b.busID}>{b.plateNumber}</option>)}</select><select className={input} value={schedule.routeID} onChange={(e) => setSchedule({ ...schedule, routeID: e.target.value })} required><option value="">Select route</option>{routes.map((r) => <option key={r.routeID} value={r.routeID}>{r.source} to {r.destination}</option>)}</select><input className={input} type="datetime-local" value={schedule.departure_time} onChange={(e) => setSchedule({ ...schedule, departure_time: e.target.value })} required /><button className={button}>Save schedule</button></form></Panel>
      </div>
      <Panel title="Schedules"><SimpleTable rows={schedules} columns={['source', 'destination', 'plateNumber', 'departure_time', 'price']} /></Panel>
      <Panel title="Tickets"><SimpleTable rows={tickets} columns={['ticketID', 'customerName', 'source', 'destination', 'seatNumber']} /></Panel>
    </main>
  );
}

function Customer({ user, setError }) {
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [seats, setSeats] = useState([]);
  const [form, setForm] = useState({ source: '', destination: '', date: '' });
  const [ticket, setTicket] = useState({ customerName: user.fullname, seatNumber: '' });

  async function load() { const [r, t] = await Promise.all([api.routes(), api.tickets()]); setRoutes(r); setTickets(t); }
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);
  const sources = [...new Set(routes.map((r) => r.source))];
  const destinations = [...new Set(routes.map((r) => r.destination))];

  async function search(e) {
    e.preventDefault();
    const params = {};
    if (form.source) params.source = form.source;
    if (form.destination) params.destination = form.destination;
    if (form.date) params.date = form.date;
    setSchedules(await api.search(params));
  }
  async function choose(s) { setSelected(s); setSeats(await api.seats(s.schID)); }
  async function book(e) { e.preventDefault(); await api.addTicket({ ...ticket, schID: selected.schID }); setSelected(null); setTicket({ customerName: user.fullname, seatNumber: '' }); load(); }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Customer Dashboard</h1>
      <Panel title="Search Trips"><form onSubmit={search} className="grid md:grid-cols-4 gap-3"><select className={input} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}><option value="">Any source</option>{sources.map((s) => <option key={s}>{s}</option>)}</select><select className={input} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })}><option value="">Any destination</option>{destinations.map((d) => <option key={d}>{d}</option>)}</select><input className={input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /><button className={button}>Search</button></form></Panel>
      <Panel title="Available Schedules"><table className="w-full text-sm"><tbody>{schedules.map((s) => <tr key={s.schID} className="border-t"><td className="p-2">{s.source} to {s.destination}</td><td className="p-2">{s.plateNumber}</td><td className="p-2">{new Date(s.departure_time).toLocaleString()}</td><td className="p-2">{Number(s.price).toLocaleString()} RWF</td><td className="p-2"><button className="text-blue-700 hover:underline" onClick={() => choose(s)}>Book</button></td></tr>)}</tbody></table></Panel>
      {selected && <Panel title="Book Ticket"><form onSubmit={book} className="grid md:grid-cols-4 gap-3 items-end"><input className={input} value={ticket.customerName} onChange={(e) => setTicket({ ...ticket, customerName: e.target.value })} required /><input className={input} type="number" min="1" max={selected.total_seat} placeholder="Seat" value={ticket.seatNumber} onChange={(e) => setTicket({ ...ticket, seatNumber: e.target.value })} required /><button className={button}>Confirm</button><button type="button" className={outline} onClick={() => setSelected(null)}>Cancel</button></form><p className="text-sm text-gray-600 mt-3">Booked seats: {seats.length ? seats.join(', ') : 'none'}</p></Panel>}
      <Panel title="Tickets"><SimpleTable rows={tickets} columns={['ticketID', 'customerName', 'source', 'destination', 'seatNumber']} /></Panel>
    </main>
  );
}

function Panel({ title, children }) {
  return <section className="bg-white border border-gray-200 rounded p-4"><h2 className="text-lg font-semibold mb-4">{title}</h2>{children}</section>;
}

function SimpleTable({ rows, columns }) {
  if (!rows.length) return <p className="text-gray-600 text-sm">No records found.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr>{columns.map((col) => <th key={col} className="text-left p-2 bg-gray-50 border-t">{col}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{columns.map((col) => <td key={col} className="p-2 border-t">{col.includes('time') && row[col] ? new Date(row[col]).toLocaleString() : row[col]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}