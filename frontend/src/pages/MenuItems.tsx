import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import Navbar from "@/components/Navbar";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: string;
}

function MenuItems() {
  const { isAdmin } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(
    null
  );
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState<string | null>("");

  const queryClient = useQueryClient();

  // Fetch menu items
  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["menuItems"],
    queryFn: async () => {
      const response = await api.get("/menu-items");
      return response.data;
    },
  });

  // Sort menu items alphabetically
  const sortedMenuItems = menuItems?.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Create menu item mutation
  const createMenuItemMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await api.post("/menu-items", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      setFormData({ name: "", description: "" });
      setIsAdding(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      createMenuItemMutation.mutate({
        name: formData.name,
        description: formData.description || undefined,
      });
    }
  };


  // Delete mutation
  const deleteMenuItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`menu-items/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
    },
  });

  // Delete menu item
  const handleDelete = (id: string) => {
    if (window.confirm("Delete this Menu item?")) {
      deleteMenuItemMutation.mutate(id);
    }
  };

  // Edit mutation
  const updateMenuItemMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      description: string;
    }) => {
      const response = await api.patch(`/menu-items/${data.id}`, {
        name: data.name,
        description: data.description,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      setEditingMenuItemId(null);
      setEditName("");
      setEditDescription("");
    },
  });

  // Edit menu item
  const handleEdit = (menuItem: MenuItem) => {
    setEditingMenuItemId(menuItem.id);
    setEditName(menuItem.name);
    setEditDescription(menuItem.description);
  };

  // Save menu item edit
  const handleSaveEdit = () => {
    if (editingMenuItemId && editName && editDescription) {
      updateMenuItemMutation.mutate({
        id: editingMenuItemId,
        name: editName,
        description: editDescription,
      });
    } else {
      console.log("Save edit failed");
    }
  };

  // Cancel menu item edit

  const handleCancelEdit = () => {
    setEditingMenuItemId(null);
    setEditName("");
    setEditDescription("");
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Menu Items</h2>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isAdding ? "Cancel" : "Add Menu Item"}
            </button>
          </div>

          {isAdding && (
            <form
              onSubmit={handleSubmit}
              className="mb-6 bg-white p-4 rounded shadow space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Bacon Cheeseburger"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the item"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <button
                type="submit"
                disabled={createMenuItemMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {createMenuItemMutation.isPending
                  ? "Adding..."
                  : "Add Menu Item"}
              </button>
            </form>
          )}

          <div className="bg-white shadow rounded-lg">
            {menuItems && menuItems.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {sortedMenuItems?.map((item) => (
                  <li key={item.id} className="px-6 py-4 hover:bg-gray-50">
                    {editingMenuItemId === item.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editDescription || ""}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
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
                        </td>
                      </>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded py-1 px-3"
                          >
                            Edit
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="bg-red-600 hover:bg-red-700 text-white rounded py-1 px-3"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                No menu items yet. Add one to get started!
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
export default MenuItems;
