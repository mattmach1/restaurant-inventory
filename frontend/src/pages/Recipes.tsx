import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import Navbar from "@/components/Navbar";

interface Location {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
}

interface Ingredient {
  id: string;
  name: string;
  price: number;
  unit: string;
}

interface MixMapping {
  id: string;
  menuItemId: string;
  locationId: string;
  ingredientId: string;
  quantity: number;
  ingredient: Ingredient;
}

function Recipes() {
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [newIngredient, setNewIngredient] = useState({
    ingredientId: "",
    quantity: "",
  });

  const [showCopyModal, setShowCopyModal] = useState(false);
  const [targetLocationId, setTargetLocationId] = useState("");

  const queryClient = useQueryClient();

  // Fetch locations
  const { data: locations } = useQuery<Location[]>({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await api.get("/locations");
      return response.data;
    },
  });

  // Fetch menu items
  const { data: menuItems } = useQuery<MenuItem[]>({
    queryKey: ["menuItems"],
    queryFn: async () => {
      const response = await api.get("/menu-items");
      return response.data;
    },
  });

  // Fetch ingredients
  const { data: ingredients } = useQuery<Ingredient[]>({
    queryKey: ["ingredients"],
    queryFn: async () => {
      const response = await api.get("/ingredients");
      return response.data;
    },
  });

  // Fetch mix mappings for selected location and menu item
  const { data: mixMappings } = useQuery<MixMapping[]>({
    queryKey: ["mixMappings", selectedMenuItemId, selectedLocationId],
    queryFn: async () => {
      const response = await api.get("/mix-mappings", {
        params: {
          menuItemId: selectedMenuItemId,
          locationId: selectedLocationId,
        },
      });
      return response.data;
    },
    enabled: !!selectedMenuItemId && !!selectedLocationId,
  });

  // Sort ingredients alphabetically
  const sortedMixMappings = mixMappings?.sort((a, b) =>
    a.ingredient.name.localeCompare(b.ingredient.name)
  );

  // Create mix mapping mutation
  const createMixMappingMutation = useMutation({
    mutationFn: async (data: {
      menuItemId: string;
      locationId: string;
      ingredientId: string;
      quantity: number;
    }) => {
      const response = await api.post("/mix-mappings", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mixMappings"] });
      setNewIngredient({ ingredientId: "", quantity: "" });
      setIsAddingIngredient(false);
    },
  });

  // Add ingredient
  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      newIngredient.ingredientId &&
      newIngredient.quantity &&
      selectedMenuItemId &&
      selectedLocationId
    ) {
      createMixMappingMutation.mutate({
        menuItemId: selectedMenuItemId,
        locationId: selectedLocationId,
        ingredientId: newIngredient.ingredientId,
        quantity: parseFloat(newIngredient.quantity),
      });
    }
  };

  // Calculate total cost
  const totalCost =
    mixMappings?.reduce((sum, mapping) => {
      return sum + mapping.ingredient.price * mapping.quantity;
    }, 0) || 0;

  const selectedMenuItem = menuItems?.find(
    (item) => item.id === selectedMenuItemId
  );

  // Copy menu mutation
  const copyMenuMutation = useMutation({
    mutationFn: async (data: {
      fromLocationId: string;
      toLocationId: string;
    }) => {
      const response = await api.post("/mix-mappings/copy", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mixMappings"] });
      setShowCopyModal(false);
      setTargetLocationId("");
      alert("Menu copied successfully!");
    },
  });

  const handleCopyMenu = () => {
    if (selectedLocationId && targetLocationId) {
      console.log("Copying from:", selectedLocationId);
      console.log("Copying to:", targetLocationId);
      copyMenuMutation.mutate({
        fromLocationId: selectedLocationId,
        toLocationId: targetLocationId,
      });
    }
  };

  // Delete mutation
  const deleteMixMappingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/mix-mappings/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mixMappings"] });
    },
  });

  // Delete ingredient
  const handleDelete = (id: string) => {
    if (window.confirm("Delete this ingredient?")) {
      deleteMixMappingMutation.mutate(id);
    }
  };

  // Edit mutation
  const updateMixMappingMutation = useMutation({
    mutationFn: async (data: { id: string; quantity: number }) => {
      const response = await api.patch(`/mix-mappings/${data.id}`, {
        quantity: data.quantity,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mixMappings"] });
      setEditingMappingId(null);
      setEditQuantity("");
    },
  });

  // Edit ingredient quantity
  const handleEdit = (mapping: MixMapping) => {
    setEditingMappingId(mapping.id);
    setEditQuantity(mapping.quantity.toString());
  };

  // Save ingredient edit
  const handleSaveEdit = () => {
    if (editingMappingId && editQuantity) {
      updateMixMappingMutation.mutate({
        id: editingMappingId,
        quantity: parseFloat(editQuantity),
      });
    }
  };

  // Cancel ingredient edit
  const handleCancelEdit = () => {
    setEditingMappingId(null);
    setEditQuantity("");
  };

  

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold mb-6">Recipes & Mix Mappings</h2>
            <button
              onClick={() => setShowCopyModal(true)}
              disabled={!selectedLocationId}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Copy Entire Menu to Another Location
            </button>
          </div>
          {/* Location and Menu Item Selection */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Location
                </label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="">Choose a location...</option>
                  {locations?.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Menu Item
                </label>
                <select
                  value={selectedMenuItemId}
                  onChange={(e) => setSelectedMenuItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  disabled={!selectedLocationId}
                >
                  <option value="">Choose a menu item...</option>
                  {menuItems?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Recipe Details */}
          {selectedMenuItemId && selectedLocationId && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedMenuItem?.name}
                  </h3>
                  {selectedMenuItem?.description && (
                    <p className="text-gray-600 text-sm">
                      {selectedMenuItem.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsAddingIngredient(!isAddingIngredient)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {isAddingIngredient ? "Cancel" : "Add Ingredient"}
                </button>
              </div>

              {/* Add Ingredient Form */}
              {isAddingIngredient && (
                <form
                  onSubmit={handleAddIngredient}
                  className="mb-6 p-4 bg-gray-50 rounded"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Ingredient
                      </label>
                      <select
                        value={newIngredient.ingredientId}
                        onChange={(e) =>
                          setNewIngredient({
                            ...newIngredient,
                            ingredientId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      >
                        <option value="">Select ingredient...</option>
                        {ingredients?.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} (${ing.price}/{ing.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newIngredient.quantity}
                        onChange={(e) =>
                          setNewIngredient({
                            ...newIngredient,
                            quantity: e.target.value,
                          })
                        }
                        placeholder="e.g., 2.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={createMixMappingMutation.isPending}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {createMixMappingMutation.isPending
                      ? "Adding..."
                      : "Add to Recipe"}
                  </button>
                </form>
              )}

              {/* Ingredients Table */}
              {mixMappings && mixMappings.length > 0 ? (
                <>
                  <table className="min-w-full divide-y divide-gray-200 mb-4">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Ingredient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Unit Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedMixMappings?.map((mapping) => (
                        <tr key={mapping.id}>
                          <td className="px-6 py-4">
                            {mapping.ingredient.name}
                          </td>
                          <td className="px-6 py-4">
                            {editingMappingId === mapping.id ? (
                              <input
                                type="number"
                                step="0.1"
                                value={editQuantity}
                                onChange={(e) =>
                                  setEditQuantity(e.target.value)
                                }
                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                              />
                            ) : (
                              `${mapping.quantity} ${mapping.ingredient.unit}`
                            )}
                          </td>
                          <td className="px-6 py-4">
                            ${mapping.ingredient.price.toFixed(2)}/
                            {mapping.ingredient.unit}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            $
                            {(
                              mapping.ingredient.price * mapping.quantity
                            ).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1">
                              {editingMappingId === mapping.id ? (
                                <>
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
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEdit(mapping)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white rounded py-1 px-3"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(mapping.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white rounded py-1 px-3"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end border-t pt-4">
                    <div className="text-xl font-bold">
                      Total Recipe Cost: ${totalCost.toFixed(2)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No ingredients added yet. Click "Add Ingredient" to start
                  building the recipe.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      {/* Copy Menu Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              Copy Menu to Another Location
            </h3>
            <p className="text-gray-600 mb-4">
              This will copy ALL menu items and their ingredients from{" "}
              <strong>
                {locations?.find((l) => l.id === selectedLocationId)?.name}
              </strong>{" "}
              to the selected location.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Target Location
              </label>
              <select
                value={targetLocationId}
                onChange={(e) => setTargetLocationId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">Select destination...</option>
                {locations
                  ?.filter((loc) => loc.id !== selectedLocationId)
                  .map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Warning: This will overwrite any existing recipes at the
                target location.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyMenu}
                disabled={!targetLocationId || copyMenuMutation.isPending}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {copyMenuMutation.isPending ? "Copying..." : "Copy Menu"}
              </button>
              <button
                onClick={() => {
                  setShowCopyModal(false);
                  setTargetLocationId("");
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Recipes;
