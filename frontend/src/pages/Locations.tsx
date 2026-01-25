import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

interface Location {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
}

function Locations() {
  const [newLocationName, setNewLocationName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null
  );
  const [editName, setEditName] = useState("");

  // Fetch locations
  const { data: locations, isLoading } = useQuery<Location[]>({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await api.get("/locations");
      return response.data;
    },
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post("/locations", { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setNewLocationName("");
      setIsAdding(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocationName.trim()) {
      createLocationMutation.mutate(newLocationName);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Delete mutation
  const deleteIngredientMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/ingredients/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });

  // Delete ingredient
  const handleDelete = (id: string) => {
    if (window.confirm("Delete this ingredient?")) {
      deleteIngredientMutation.mutate(id);
    }
  };

  // Edit mutation
  const updateLocationMutation = useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const response = await api.patch(`/locations/${data.id}`, {
        name: data.name,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });

  // Edit location
  const handleEdit = (location: Location) => {
    setEditingLocationId(location.id);
    setEditName(location.name);
  };

  // Save location edit
  const handleSaveEdit = () => {
    if (editingLocationId && editName) {
      updateLocationMutation.mutate({
        id: editingLocationId,
        name: editName,
      });
    } else {
      console.log("Validation failed");
    }
  };

  // Cancel location edit
  const handleCancelEdit = () => {
    setEditingLocationId(null);
    setEditName("");
  };

  if (isLoading) return <div> Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Restaurant Inventory</h1>
              <a href="/dashboard" className="text-blue-600 hover:underline">
                Dashboard
              </a>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Locations</h2>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isAdding ? "Cancel" : "Add Location"}
            </button>
          </div>

          {isAdding && (
            <form
              onSubmit={handleSubmit}
              className="mb-6 bg-white p-4 rounded shadow"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="Location name (e.g., Downtown)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={createLocationMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {createLocationMutation.isPending ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          )}

          <div className="bg-white shadow rounded-lg">
            {locations && locations.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {locations.map((location) => (
                  <li key={location.id} className="px-6 py-4 hover:bg-gray-50">
                    {editingLocationId === location.id ? (
                      <>
                        <div className="flex justify-between items-center">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={handleSaveEdit}
                              className="bg-green-600 hover:bg-green-700 text-white rounded py-1 px-3"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-gray-500 hover:bg-gray-600 text-white rounded py-1 px-3"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium">
                            {location.name}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(location)}
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded py-1 px-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(location.id)}
                              className="bg-red-600 hover:bg-red-700 text-white rounded py-1 px-3"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                No locations yet. Add one to get started!
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Locations;
