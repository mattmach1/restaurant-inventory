import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Users, LogOut } from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen br-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">Restaurant Inventory</h1>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
                <div className="text-right">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <a
                      href="/users"
                      className="cursor-pointer flex items-center"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </a>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 flex items-center"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
          <p className="text-gray-600 mb-8">
            Welcome to your restaurants inventory system
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/locations"
              className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold mb-2">Locations</h3>
              <p className="text-gray-600 text-sm">
                Manage your restaurant locations
              </p>
            </Link>

            <Link
              to="/ingredients"
              className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
              <p className="text-gray-600 text-sm">
                Manage ingredient inventory
              </p>
            </Link>

            <Link
              to="/menu-items"
              className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold mb-2">Menu Items</h3>
              <p className="text-gray-600 text-sm">Manage your menu</p>
            </Link>

            <Link
              to="/recipes"
              className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold mb-2">Recipes</h3>
              <p className="text-gray-600 text-sm">Manage mix mappings</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
