import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const inputClass = 'w-full border border-gray-300 rounded px-3 py-2';
const buttonClass = 'bg-gray-900 text-white rounded px-3 py-2 hover:bg-gray-800';
const lightButtonClass = 'border border-gray-300 rounded px-3 py-2 hover:bg-gray-100';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [customerName, setCustomerName] = useState(user?.fullname || '');
  const [seatNumber, setSeatNumber] = useState('');
  const [search, setSearch] = useState({ source: '', destination: '', date: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadStartData();
  }, []);

  async function loadStartData() {
    try {
      const [routeData, ticketData] = await Promise.all([api.getRoutes(), api.getTickets()]);
      setRoutes(routeData);
      setTickets(ticketData);
    } catch (err) {
      setError(err.message);
    }
  }

  async function searchTrips(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const params = {};
      if (search.source) params.source = search.source;
      if (search.destination) params.destination = search.destination;
      if (search.date) params.date = search.date;
      setSchedules(await api.searchSchedules(params));
    } catch (err) {
      setError(err.message);
    }
  }

  async function selectSchedule(schedule) {
    setSelectedSchedule(schedule);
    setSeatNumber('');
    setBookedSeats(await api.getBookedSeats(schedule.schID));
  }

  async function bookTicket(e) {
    e.preventDefault();
    if (!selectedSchedule) return;
    try {
      await api.bookTicket({ customerName, schID: selectedSchedule.schID, seatNumber });
      setMessage('Ticket booked successfully.');
      setSelectedSchedule(null);
      setBookedSeats([]);
      setSeatNumber('');
      loadStartData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cancelTicket(id) {
    if (!confirm('Cancel this ticket?')) return;
    await api.deleteTicket(id);
    loadStartData();
  }

  const sources = [...new Set(routes.map((route) => route.source))];
  const destinations = [...new Set(routes.map((route) => route.destination))];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Customer Dashboard</h1>
          <p className="text-gray-600">Choose source, destination and departure day.</p>
        </div>

        {message && <p className="bg-green-50 border border-green-200 text-green-700 rounded p-2 text-sm">{message}</p>}
        {error && <p className="bg-red-50 border border-red-200 text-red-700 rounded p-2 text-sm">{error}</p>}

        <section className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-lg font-semibold mb-4">Search Trips</h2>
          <form onSubmit={searchTrips} className="grid md:grid-cols-4 gap-3">
            <select className={inputClass} value={search.source} onChange={(e) => setSearch({ ...search, source: e.target.value })}>
              <option value="">Any source</option>
              {sources.map((source) => <option key={source} value={source}>{source}</option>)}
            </select>
            <select className={inputClass} value={search.destination} onChange={(e) => setSearch({ ...search, destination: e.target.value })}>
              <option value="">Any destination</option>
              {destinations.map((destination) => <option key={destination} value={destination}>{destination}</option>)}
            </select>
            <input className={inputClass} type="date" value={search.date} onChange={(e) => setSearch({ ...search, date: e.target.value })} />
            <button className={buttonClass}>Search</button>
          </form>
        </section>

        <section className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-lg font-semibold mb-4">Available Schedules</h2>
          {schedules.length === 0 ? (
            <p className="text-gray-600">No schedules selected yet. Search to display trips.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2 bg-gray-50 border-t">Route</th>
                    <th className="text-left p-2 bg-gray-50 border-t">Bus</th>
                    <th className="text-left p-2 bg-gray-50 border-t">Departure</th>
                    <th className="text-left p-2 bg-gray-50 border-t">Price</th>
                    <th className="text-left p-2 bg-gray-50 border-t">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule.schID}>
                      <td className="p-2 border-t">{schedule.source} to {schedule.destination}</td>
                      <td className="p-2 border-t">{schedule.plateNumber} ({schedule.total_seat} seats)</td>
                      <td className="p-2 border-t">{new Date(schedule.departure_time).toLocaleString()}</td>
                      <td className="p-2 border-t">{Number(schedule.price || 0).toLocaleString()} RWF</td>
                      <td className="p-2 border-t"><button className="text-blue-700 hover:underline" onClick={() => selectSchedule(schedule)}>Book</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedSchedule && (
          <section className="bg-white border border-gray-200 rounded p-4">
            <h2 className="text-lg font-semibold mb-2">Book Ticket</h2>
            <p className="text-sm text-gray-600 mb-4">
              {selectedSchedule.source} to {selectedSchedule.destination}, {new Date(selectedSchedule.departure_time).toLocaleString()}
            </p>

            <form onSubmit={bookTicket} className="grid md:grid-cols-4 gap-3 items-end">
              <label>
                <span className="block text-sm text-gray-700 mb-1">Customer name</span>
                <input className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              </label>
              <label>
                <span className="block text-sm text-gray-700 mb-1">Seat number</span>
                <input className={inputClass} type="number" min="1" max={selectedSchedule.total_seat || 45} value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} required />
              </label>
              <button className={buttonClass}>Confirm booking</button>
              <button type="button" className={lightButtonClass} onClick={() => setSelectedSchedule(null)}>Cancel</button>
            </form>
            <p className="text-sm text-gray-600 mt-3">
              Booked seats: {bookedSeats.length ? bookedSeats.join(', ') : 'none'}
            </p>
          </section>
        )}

        <section className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-lg font-semibold mb-4">Tickets</h2>
          {tickets.length === 0 ? (
            <p className="text-gray-600">No tickets booked yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2 bg-gray-50 border-t">Ticket</th>
                    <th className="text-left p-2 bg-gray-50 border-t">Customer</th>
                    <th className="text-left p-2 bg-gray-50 border-t">Route</th>
                    <th className="text-left p-2 bg-gray-50 border-t">Seat</th>
                    <th className="text-left p-2 bg-gray-50 border-t">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.ticketID}>
                      <td className="p-2 border-t">#{ticket.ticketID}</td>
                      <td className="p-2 border-t">{ticket.customerName}</td>
                      <td className="p-2 border-t">{ticket.source} to {ticket.destination}</td>
                      <td className="p-2 border-t">{ticket.seatNumber}</td>
                      <td className="p-2 border-t"><button className="text-red-700 hover:underline" onClick={() => cancelTicket(ticket.ticketID)}>Cancel</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}