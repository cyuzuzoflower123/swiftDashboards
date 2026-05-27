import { useEffect, useState } from 'react';
import { api } from '../api';
import Navbar from '../components/Navbar';

const emptyBus = { plateNumber: '', total_seat: '' };
const emptyRoute = { source: '', destination: '', price: '' };
const emptySchedule = { busID: '', routeID: '', departure_time: '' };

function Section({ title, children }) {
  return (
    <section className="bg-white border border-gray-200 rounded p-4">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'w-full border border-gray-300 rounded px-3 py-2';
const buttonClass = 'bg-gray-900 text-white rounded px-3 py-2 hover:bg-gray-800';
const lightButtonClass = 'border border-gray-300 rounded px-3 py-2 hover:bg-gray-100';

export default function ManagerDashboard() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [busForm, setBusForm] = useState(emptyBus);
  const [routeForm, setRouteForm] = useState(emptyRoute);
  const [scheduleForm, setScheduleForm] = useState(emptySchedule);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadAll() {
    try {
      const [busData, routeData, scheduleData, ticketData] = await Promise.all([
        api.getBuses(),
        api.getRoutes(),
        api.getSchedules(),
        api.getTickets(),
      ]);
      setBuses(busData);
      setRoutes(routeData);
      setSchedules(scheduleData);
      setTickets(ticketData);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function saveBus(e) {
    e.preventDefault();
    await api.addBus(busForm);
    setBusForm(emptyBus);
    setMessage('Bus added.');
    loadAll();
  }

  async function saveRoute(e) {
    e.preventDefault();
    await api.addRoute(routeForm);
    setRouteForm(emptyRoute);
    setMessage('Route added.');
    loadAll();
  }

  async function saveSchedule(e) {
    e.preventDefault();
    await api.addSchedule(scheduleForm);
    setScheduleForm(emptySchedule);
    setMessage('Schedule added.');
    loadAll();
  }

  async function removeBus(id) {
    if (!confirm('Delete this bus?')) return;
    await api.deleteBus(id);
    loadAll();
  }

  async function removeRoute(id) {
    if (!confirm('Delete this route?')) return;
    await api.deleteRoute(id);
    loadAll();
  }

  async function removeSchedule(id) {
    if (!confirm('Delete this schedule?')) return;
    await api.deleteSchedule(id);
    loadAll();
  }

  async function removeTicket(id) {
    if (!confirm('Cancel this ticket?')) return;
    await api.deleteTicket(id);
    loadAll();
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manager Dashboard</h1>
            <p className="text-gray-600">Register buses, routes and schedules.</p>
          </div>
          <button className={lightButtonClass} onClick={loadAll}>Refresh</button>
        </div>

        {message && <p className="bg-green-50 border border-green-200 text-green-700 rounded p-2 text-sm">{message}</p>}
        {error && <p className="bg-red-50 border border-red-200 text-red-700 rounded p-2 text-sm">{error}</p>}

        <div className="grid md:grid-cols-3 gap-4">
          <Section title="Add Bus">
            <form onSubmit={saveBus} className="space-y-3">
              <Field label="Plate number">
                <input className={inputClass} value={busForm.plateNumber} onChange={(e) => setBusForm({ ...busForm, plateNumber: e.target.value })} required />
              </Field>
              <Field label="Total seats">
                <input className={inputClass} type="number" min="1" value={busForm.total_seat} onChange={(e) => setBusForm({ ...busForm, total_seat: e.target.value })} required />
              </Field>
              <button className={buttonClass}>Save bus</button>
            </form>
          </Section>

          <Section title="Add Route">
            <form onSubmit={saveRoute} className="space-y-3">
              <Field label="Source">
                <input className={inputClass} value={routeForm.source} onChange={(e) => setRouteForm({ ...routeForm, source: e.target.value })} required />
              </Field>
              <Field label="Destination">
                <input className={inputClass} value={routeForm.destination} onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })} required />
              </Field>
              <Field label="Price">
                <input className={inputClass} type="number" min="0" value={routeForm.price} onChange={(e) => setRouteForm({ ...routeForm, price: e.target.value })} required />
              </Field>
              <button className={buttonClass}>Save route</button>
            </form>
          </Section>

          <Section title="Add Schedule">
            <form onSubmit={saveSchedule} className="space-y-3">
              <Field label="Bus">
                <select className={inputClass} value={scheduleForm.busID} onChange={(e) => setScheduleForm({ ...scheduleForm, busID: e.target.value })} required>
                  <option value="">Select bus</option>
                  {buses.map((bus) => <option key={bus.busID} value={bus.busID}>{bus.plateNumber}</option>)}
                </select>
              </Field>
              <Field label="Route">
                <select className={inputClass} value={scheduleForm.routeID} onChange={(e) => setScheduleForm({ ...scheduleForm, routeID: e.target.value })} required>
                  <option value="">Select route</option>
                  {routes.map((route) => <option key={route.routeID} value={route.routeID}>{route.source} to {route.destination}</option>)}
                </select>
              </Field>
              <Field label="Departure time">
                <input className={inputClass} type="datetime-local" value={scheduleForm.departure_time} onChange={(e) => setScheduleForm({ ...scheduleForm, departure_time: e.target.value })} required />
              </Field>
              <button className={buttonClass}>Save schedule</button>
            </form>
          </Section>
        </div>

        <Section title="Buses">
          <Table headers={['Plate', 'Seats', 'Action']}>
            {buses.map((bus) => (
              <tr key={bus.busID}>
                <td className="p-2 border-t">{bus.plateNumber}</td>
                <td className="p-2 border-t">{bus.total_seat}</td>
                <td className="p-2 border-t"><button className="text-red-700 hover:underline" onClick={() => removeBus(bus.busID)}>Delete</button></td>
              </tr>
            ))}
          </Table>
        </Section>

        <Section title="Routes">
          <Table headers={['Source', 'Destination', 'Price', 'Action']}>
            {routes.map((route) => (
              <tr key={route.routeID}>
                <td className="p-2 border-t">{route.source}</td>
                <td className="p-2 border-t">{route.destination}</td>
                <td className="p-2 border-t">{Number(route.price).toLocaleString()} RWF</td>
                <td className="p-2 border-t"><button className="text-red-700 hover:underline" onClick={() => removeRoute(route.routeID)}>Delete</button></td>
              </tr>
            ))}
          </Table>
        </Section>

        <Section title="Schedules">
          <Table headers={['Route', 'Bus', 'Departure', 'Price', 'Action']}>
            {schedules.map((schedule) => (
              <tr key={schedule.schID}>
                <td className="p-2 border-t">{schedule.source} to {schedule.destination}</td>
                <td className="p-2 border-t">{schedule.plateNumber}</td>
                <td className="p-2 border-t">{new Date(schedule.departure_time).toLocaleString()}</td>
                <td className="p-2 border-t">{Number(schedule.price || 0).toLocaleString()} RWF</td>
                <td className="p-2 border-t"><button className="text-red-700 hover:underline" onClick={() => removeSchedule(schedule.schID)}>Delete</button></td>
              </tr>
            ))}
          </Table>
        </Section>

        <Section title="Booked Tickets">
          <Table headers={['Ticket', 'Customer', 'Route', 'Bus', 'Seat', 'Action']}>
            {tickets.map((ticket) => (
              <tr key={ticket.ticketID}>
                <td className="p-2 border-t">#{ticket.ticketID}</td>
                <td className="p-2 border-t">{ticket.customerName}</td>
                <td className="p-2 border-t">{ticket.source} to {ticket.destination}</td>
                <td className="p-2 border-t">{ticket.plateNumber}</td>
                <td className="p-2 border-t">{ticket.seatNumber}</td>
                <td className="p-2 border-t"><button className="text-red-700 hover:underline" onClick={() => removeTicket(ticket.ticketID)}>Cancel</button></td>
              </tr>
            ))}
          </Table>
        </Section>
      </main>
    </div>
  );
}

function Table({ headers, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((header) => <th key={header} className="text-left p-2 bg-gray-50 border-t">{header}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}