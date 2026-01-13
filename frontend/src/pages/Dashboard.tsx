 import { useNavigate } from 'react-router-dom';
 import { useEffect, useState } from 'react';

 interface User {
    id: string;
    email: string;
    name: string;
    organizationId: string;
 }

export default function Dashboard() {
    const navigate = useNavigate();

    const getUserFromStorage = (): User | null => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null; 
    }
    
    const [user] = useState<User | null>(getUserFromStorage())

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/login');
            return;
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    }

    if (!user) return <div>Loading...</div>;


  return (
    <div className="min-h-screen br-gray-50">
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <h1 className="text-xl font-bold">Restaurant Inventory</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                            {user.name} {user.email}
                        </span>
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
                <p className="text-gray-600">Welcome to your restaurants inventory system</p>
            </div>
        </main>
    </div>
  )
}

