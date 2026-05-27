import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { enableDemoMode } from '../api';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullname: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (isRegister) {
        await register(form.fullname, form.email, form.phone, form.password, form.role);
        setMessage('Account created. You can now sign in.');
        setIsRegister(false);
      } else {
        await login(form.email, form.password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function demoLogin(role) {
    enableDemoMode();
    setLoading(true);
    setError('');
    try {
      await login(role === 'manager' ? 'manager@swift.com' : 'customer@swift.com', 'demo');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <section className="w-full max-w-md bg-white border border-gray-200 rounded p-6">
        <h1 className="text-2xl font-bold text-gray-900">Swift Fleet</h1>
        <p className="text-gray-600 mt-1">Simple bus ticket reservation system</p>

        <div className="grid grid-cols-2 gap-2 mt-5">
          <button onClick={() => demoLogin('manager')} className="border border-gray-300 rounded px-3 py-2 hover:bg-gray-100">
            Demo Manager
          </button>
          <button onClick={() => demoLogin('customer')} className="border border-gray-300 rounded px-3 py-2 hover:bg-gray-100">
            Demo Customer
          </button>
        </div>

        <h2 className="text-lg font-semibold mt-6">{isRegister ? 'Register' : 'Login'}</h2>
        {message && <p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</p>}

        <form onSubmit={submit} className="mt-4 space-y-3">
          {isRegister && (
            <>
              <input className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Full name" value={form.fullname} onChange={(e) => update('fullname', e.target.value)} required />
              <input className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
              <select className="w-full border border-gray-300 rounded px-3 py-2" value={form.role} onChange={(e) => update('role', e.target.value)}>
                <option value="customer">Customer</option>
                <option value="manager">Manager</option>
              </select>
            </>
          )}

          <input className="w-full border border-gray-300 rounded px-3 py-2" type="email" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          <input className="w-full border border-gray-300 rounded px-3 py-2" type="password" placeholder="Password" value={form.password} onChange={(e) => update('password', e.target.value)} required />

          <button disabled={loading} className="w-full bg-gray-900 text-white rounded px-3 py-2 hover:bg-gray-800 disabled:opacity-60">
            {loading ? 'Please wait...' : isRegister ? 'Create account' : 'Login'}
          </button>
        </form>

        <button onClick={() => setIsRegister(!isRegister)} className="mt-4 text-sm text-blue-700 hover:underline">
          {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </section>
    </main>
  );
}