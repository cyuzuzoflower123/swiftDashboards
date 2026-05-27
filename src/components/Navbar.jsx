import { useAuth } from '../context/AuthContext';
import { isDemoMode } from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const demo = isDemoMode();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Swift Fleet</h1>
          <p className="text-sm text-gray-500">Bus ticket reservation</p>
        </div>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            {demo && <span className="text-gray-500">Demo</span>}
            <span className="hidden sm:inline text-gray-700">{user.fullname} ({user.role})</span>
            <button onClick={logout} className="border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-100">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
