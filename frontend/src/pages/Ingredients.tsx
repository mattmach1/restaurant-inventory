import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

interface Ingredient {
  id: string;
  name: string;
  price: number;
  unit: string;
  organizationId: string;
  createdAt: string;
}

export default function Ingredients() {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    unit: "",
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch ingredients
  const { data: ingredients, isLoading } = useQuery<Ingredient[]>({
    queryKey: ["ingredients"],
    queryFn: async () => {
      const response = await api.get("/ingredients");
      return response.data;
    },
  });

  // Create ingredient mutation
  const createIngredientMutation = useMutation({
    mutationFn: async (data: { name: string; price: number; unit: string }) => {
      const response = await api.post("/ingredients", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      setFormData({ name: "", price: "", unit: "" });
      setIsAdding(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.price && formData.unit) {
      createIngredientMutation.mutate({
        name: formData.name,
        price: parseFloat(formData.price),
        unit: formData.unit,
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (isLoading) return <div>Loading...</div>;

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
            <h2 className="text-2xl font-bold">Ingredients</h2>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isAdding ? "Cancel" : "Add Ingredient"}
            </button>
          </div>

          {isAdding && (
            <form
              onSubmit={handleSubmit}
              className="mb-6 bg-white p-4 rounded shadow space-y-4"
            >
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    placeholder="lb, oz, each"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={createIngredientMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {createIngredientMutation.isPending
                  ? "Adding..."
                  : "Add Ingredient"}
              </button>
            </form>
          )}

          <div className="bg-white shadow rounded-lg overflow-hidden">
            {ingredients && ingredients.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ingredients.map((ingredient) => (
                    <tr key={ingredient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ingredient.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${ingredient.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ingredient.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ingredient.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                No ingredients yet. Add one to get started!
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
