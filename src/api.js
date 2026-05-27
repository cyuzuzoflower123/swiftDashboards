const BASE = 'http://localhost:3000/api';

// Demo mode data (used when backend is not available)
let demoMode = false;
let demoUser = null;

const demoBuses = [
  { busID: 1, plateNumber: 'RAA 100A', total_seat: 45 },
  { busID: 2, plateNumber: 'RAB 200B', total_seat: 30 },
  { busID: 3, plateNumber: 'RAC 300C', total_seat: 50 },
  { busID: 4, plateNumber: 'RAD 400D', total_seat: 40 },
];

const demoRoutes = [
  { routeID: 1, source: 'Kigali', destination: 'Musanze', price: 3500 },
  { routeID: 2, source: 'Kigali', destination: 'Huye', price: 3000 },
  { routeID: 3, source: 'Kigali', destination: 'Rubavu', price: 5000 },
  { routeID: 4, source: 'Musanze', destination: 'Rubavu', price: 2500 },
  { routeID: 5, source: 'Huye', destination: 'Kigali', price: 3000 },
];

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfter = new Date();
dayAfter.setDate(dayAfter.getDate() + 2);

const demoSchedules = [
  { schID: 1, busID: 1, routeID: 1, departure_time: new Date(tomorrow.setHours(6, 0)).toISOString(), plateNumber: 'RAA 100A', total_seat: 45, source: 'Kigali', destination: 'Musanze', price: 3500 },
  { schID: 2, busID: 2, routeID: 2, departure_time: new Date(tomorrow.setHours(8, 30)).toISOString(), plateNumber: 'RAB 200B', total_seat: 30, source: 'Kigali', destination: 'Huye', price: 3000 },
  { schID: 3, busID: 3, routeID: 3, departure_time: new Date(tomorrow.setHours(10, 0)).toISOString(), plateNumber: 'RAC 300C', total_seat: 50, source: 'Kigali', destination: 'Rubavu', price: 5000 },
  { schID: 4, busID: 4, routeID: 4, departure_time: new Date(dayAfter.setHours(7, 0)).toISOString(), plateNumber: 'RAD 400D', total_seat: 40, source: 'Musanze', destination: 'Rubavu', price: 2500 },
  { schID: 5, busID: 1, routeID: 5, departure_time: new Date(dayAfter.setHours(14, 0)).toISOString(), plateNumber: 'RAA 100A', total_seat: 45, source: 'Huye', destination: 'Kigali', price: 3000 },
];

let demoTickets = [
  { ticketID: 1, customerName: 'Jean Baptiste', schID: 1, seatNumber: 5, departure_time: demoSchedules[0].departure_time, plateNumber: 'RAA 100A', total_seat: 45, source: 'Kigali', destination: 'Musanze', price: 3500 },
  { ticketID: 2, customerName: 'Marie Claire', schID: 1, seatNumber: 12, departure_time: demoSchedules[0].departure_time, plateNumber: 'RAA 100A', total_seat: 45, source: 'Kigali', destination: 'Musanze', price: 3500 },
];

let nextTicketId = 3;

async function request(url, options = {}) {
  try {
    const res = await fetch(`${BASE}${url}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (err) {
    // If fetch fails (network error), enable demo mode
    if (err instanceof TypeError && err.message.includes('fetch')) {
      demoMode = true;
      throw new Error('DEMO_MODE');
    }
    throw err;
  }
}

export const isDemoMode = () => demoMode;
export const enableDemoMode = () => { demoMode = true; };

export const api = {
  // Auth
  register: async (body) => {
    if (demoMode) return { message: 'Registration successful (demo)' };
    return request('/register', { method: 'POST', body: JSON.stringify(body) });
  },

  login: async (body) => {
    if (demoMode) {
      // Demo login
      if (body.email === 'manager@swift.com') {
        demoUser = { id: 1, fullname: 'Fleet Manager', email: 'manager@swift.com', role: 'manager' };
      } else {
        demoUser = { id: 2, fullname: body.email.split('@')[0] || 'Customer', email: body.email, role: 'customer' };
      }
      return { message: 'Login successful', user: demoUser };
    }
    return request('/login', { method: 'POST', body: JSON.stringify(body) });
  },

  logout: async () => {
    if (demoMode) { demoUser = null; return { message: 'Logged out' }; }
    return request('/logout', { method: 'POST' });
  },

  session: async () => {
    if (demoMode) {
      if (demoUser) return { user: demoUser };
      throw new Error('Not authenticated');
    }
    return request('/session');
  },

  // Buses
  getBuses: async () => {
    if (demoMode) return [...demoBuses];
    return request('/buses');
  },
  addBus: async (body) => {
    if (demoMode) {
      demoBuses.push({ busID: demoBuses.length + 10, ...body });
      return { message: 'Bus added (demo)' };
    }
    return request('/buses', { method: 'POST', body: JSON.stringify(body) });
  },
  updateBus: async (id, body) => {
    if (demoMode) {
      const idx = demoBuses.findIndex(b => b.busID === Number(id));
      if (idx >= 0) Object.assign(demoBuses[idx], body);
      return { message: 'Bus updated (demo)' };
    }
    return request(`/buses/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  deleteBus: async (id) => {
    if (demoMode) {
      const idx = demoBuses.findIndex(b => b.busID === Number(id));
      if (idx >= 0) demoBuses.splice(idx, 1);
      return { message: 'Bus deleted (demo)' };
    }
    return request(`/buses/${id}`, { method: 'DELETE' });
  },

  // Routes
  getRoutes: async () => {
    if (demoMode) return [...demoRoutes];
    return request('/routes');
  },
  addRoute: async (body) => {
    if (demoMode) {
      demoRoutes.push({ routeID: demoRoutes.length + 10, ...body });
      return { message: 'Route added (demo)' };
    }
    return request('/routes', { method: 'POST', body: JSON.stringify(body) });
  },
  updateRoute: async (id, body) => {
    if (demoMode) {
      const idx = demoRoutes.findIndex(r => r.routeID === Number(id));
      if (idx >= 0) Object.assign(demoRoutes[idx], body);
      return { message: 'Route updated (demo)' };
    }
    return request(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  deleteRoute: async (id) => {
    if (demoMode) {
      const idx = demoRoutes.findIndex(r => r.routeID === Number(id));
      if (idx >= 0) demoRoutes.splice(idx, 1);
      return { message: 'Route deleted (demo)' };
    }
    return request(`/routes/${id}`, { method: 'DELETE' });
  },

  // Schedules
  getSchedules: async () => {
    if (demoMode) return [...demoSchedules];
    return request('/schedules');
  },
  addSchedule: async (body) => {
    if (demoMode) {
      const bus = demoBuses.find(b => b.busID === Number(body.busID));
      const route = demoRoutes.find(r => r.routeID === Number(body.routeID));
      demoSchedules.push({
        schID: demoSchedules.length + 10,
        ...body,
        plateNumber: bus?.plateNumber || '',
        total_seat: bus?.total_seat || 45,
        source: route?.source || '',
        destination: route?.destination || '',
        price: route?.price || 0,
      });
      return { message: 'Schedule added (demo)' };
    }
    return request('/schedules', { method: 'POST', body: JSON.stringify(body) });
  },
  updateSchedule: async (id, body) => {
    if (demoMode) {
      const idx = demoSchedules.findIndex(s => s.schID === Number(id));
      if (idx >= 0) {
        const bus = demoBuses.find(b => b.busID === Number(body.busID));
        const route = demoRoutes.find(r => r.routeID === Number(body.routeID));
        Object.assign(demoSchedules[idx], body, {
          plateNumber: bus?.plateNumber || '',
          total_seat: bus?.total_seat || 45,
          source: route?.source || '',
          destination: route?.destination || '',
          price: route?.price || 0,
        });
      }
      return { message: 'Schedule updated (demo)' };
    }
    return request(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  deleteSchedule: async (id) => {
    if (demoMode) {
      const idx = demoSchedules.findIndex(s => s.schID === Number(id));
      if (idx >= 0) demoSchedules.splice(idx, 1);
      return { message: 'Schedule deleted (demo)' };
    }
    return request(`/schedules/${id}`, { method: 'DELETE' });
  },

  // Tickets
  getTickets: async () => {
    if (demoMode) return [...demoTickets];
    return request('/tickets');
  },
  getBookedSeats: async (schID) => {
    if (demoMode) return demoTickets.filter(t => t.schID === Number(schID)).map(t => t.seatNumber);
    return request(`/tickets/schedule/${schID}`);
  },
  bookTicket: async (body) => {
    if (demoMode) {
      const existing = demoTickets.find(t => t.schID === Number(body.schID) && t.seatNumber === Number(body.seatNumber));
      if (existing) throw new Error('Seat already booked');
      const schedule = demoSchedules.find(s => s.schID === Number(body.schID));
      demoTickets.push({
        ticketID: nextTicketId++,
        customerName: body.customerName,
        schID: Number(body.schID),
        seatNumber: Number(body.seatNumber),
        departure_time: schedule?.departure_time || '',
        plateNumber: schedule?.plateNumber || '',
        total_seat: schedule?.total_seat || 45,
        source: schedule?.source || '',
        destination: schedule?.destination || '',
        price: schedule?.price || 0,
      });
      return { message: 'Ticket booked (demo)' };
    }
    return request('/tickets', { method: 'POST', body: JSON.stringify(body) });
  },
  deleteTicket: async (id) => {
    if (demoMode) {
      demoTickets = demoTickets.filter(t => t.ticketID !== Number(id));
      return { message: 'Ticket cancelled (demo)' };
    }
    return request(`/tickets/${id}`, { method: 'DELETE' });
  },

  // Search
  searchSchedules: async (params) => {
    if (demoMode) {
      return demoSchedules.filter(s => {
        if (params.source && s.source !== params.source) return false;
        if (params.destination && s.destination !== params.destination) return false;
        if (params.date && !s.departure_time.startsWith(params.date)) return false;
        return true;
      });
    }
    const qs = new URLSearchParams(params).toString();
    return request(`/search?${qs}`);
  },
};
