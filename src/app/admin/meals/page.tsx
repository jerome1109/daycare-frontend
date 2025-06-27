"use client";

import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Pencil, Power } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface MealPlan {
  id: number;
  daycareId: number;
  childId: number;
  mealDate: string;
  mealType: string;
  menuItems: string; // JSON string
  allergens: string; // JSON string
  nutritionalInfo: string; // JSON string
  notes: string;
  createdBy: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MealPlanFormData {
  mealDate: string;
  mealType: string;
  menuItems: string;
  allergens: string;
  nutritionalInfo: string;
  notes: string;
  childId: number | null;
  daycareId: number;
}

export default function MealPlanManagement() {
  const { makeAuthenticatedRequest, isLoading: authLoading, user } = useAuth();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlan | null>(null);
  const [formData, setFormData] = useState<MealPlanFormData>({
    mealDate: "",
    mealType: "",
    menuItems: "[]",
    allergens: "[]",
    nutritionalInfo: "{}",
    notes: "",
    childId: null,
    daycareId: user?.daycare?.id || 0,
  });
  const [children, setChildren] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredChildren, setFilteredChildren] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mealPlanToDelete, setMealPlanToDelete] = useState<MealPlan | null>(
    null
  );

  const fetchMealPlans = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest("/meal-plans");
      setMealPlans((response as { data: MealPlan[] }).data);
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch meal plans"
      );
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  const fetchChildren = useCallback(
    async (search?: string) => {
      try {
        const response = await makeAuthenticatedRequest(
          `/children?search=${search || ""}`
        );
        const childrenData = (
          response as {
            children: Array<{
              id: number;
              firstName: string;
              lastName: string;
            }>;
          }
        ).children.map((child) => ({
          id: child.id,
          name: `${child.firstName} ${child.lastName}`,
        }));
        setChildren(childrenData);
        setFilteredChildren(childrenData);
      } catch (error: unknown) {
        console.error(error);
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch children"
        );
      }
    },
    [makeAuthenticatedRequest]
  );

  useEffect(() => {
    if (!authLoading) {
      fetchMealPlans();
      fetchChildren();
    }
  }, [authLoading, fetchMealPlans, fetchChildren]);

  useEffect(() => {
    const filtered = children.filter((child) =>
      child.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredChildren(filtered);
  }, [searchQuery, children]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const processedFormData = {
        ...formData,
        menuItems: formData.menuItems ? JSON.parse(formData.menuItems) : [],
        allergens: formData.allergens ? JSON.parse(formData.allergens) : [],
        nutritionalInfo: formData.nutritionalInfo
          ? JSON.parse(formData.nutritionalInfo)
          : {},
        childId: formData.childId == 0 ? null : formData.childId,
        daycareId: user?.daycare?.id || 0,
      };
      console.log(processedFormData);

      if (editingMealPlan) {
        await makeAuthenticatedRequest(`/meal-plans/${editingMealPlan.id}`, {
          method: "PUT",
          body: JSON.stringify(processedFormData),
        });
        toast.success("Meal plan updated successfully");
      } else {
        await makeAuthenticatedRequest("/meal-plans", {
          method: "POST",
          body: JSON.stringify(processedFormData),
        });
        toast.success("Meal plan created successfully");
      }
      setIsOpen(false);
      fetchMealPlans();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save meal plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (mealPlan: MealPlan) => {
    setMealPlanToDelete(mealPlan);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!mealPlanToDelete) return;

    try {
      await makeAuthenticatedRequest(`/meal-plans/${mealPlanToDelete.id}/`, {
        method: "DELETE",
      });
      toast.success(
        `Meal plan ${
          mealPlanToDelete.isActive ? "deactivated" : "activated"
        } successfully`
      );
      fetchMealPlans();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to DELETE meal plan"
      );
    } finally {
      setDeleteConfirmOpen(false);
      setMealPlanToDelete(null);
    }
  };

  const handleEdit = (mealPlan: MealPlan) => {
    setEditingMealPlan(mealPlan);
    setFormData({
      mealDate: mealPlan.mealDate,
      mealType: mealPlan.mealType,
      menuItems: mealPlan.menuItems,
      allergens: mealPlan.allergens,
      nutritionalInfo: mealPlan.nutritionalInfo,
      notes: mealPlan.notes,
      childId: mealPlan.childId || null,
      daycareId: mealPlan.daycareId,
    });
    setIsOpen(true);
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Meal Plan Management
          </h2>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingMealPlan(null);
                  setFormData({
                    mealDate: "",
                    mealType: "",
                    menuItems: "[]",
                    allergens: "[]",
                    nutritionalInfo: "{}",
                    notes: "",
                    childId: null,
                    daycareId: user?.daycare?.id || 0,
                  });
                }}
                className="w-full sm:w-auto"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Meal Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingMealPlan ? "Edit Meal Plan" : "Add New Meal Plan"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <div className="space-y-2">
                  <label htmlFor="mealDate" className="text-sm font-medium">
                    Meal Date
                  </label>
                  <Input
                    id="mealDate"
                    type="date"
                    value={formData.mealDate}
                    onChange={(e) =>
                      setFormData({ ...formData, mealDate: e.target.value })
                    }
                    required
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="childId" className="text-sm font-medium">
                    Child
                  </label>
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Search children..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-2"
                    />
                    <select
                      id="childId"
                      value={formData.childId || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          childId: Number(e.target.value),
                        });
                      }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">Select a child...</option>
                      {filteredChildren.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="mealType" className="text-sm font-medium">
                    Meal Type
                  </label>
                  <Input
                    id="mealType"
                    placeholder="e.g., lunch, breakfast"
                    value={formData.mealType}
                    onChange={(e) =>
                      setFormData({ ...formData, mealType: e.target.value })
                    }
                    required
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="menuItems" className="text-sm font-medium">
                    Menu Items
                  </label>
                  <div className="space-y-2">
                    {JSON.parse(formData.menuItems || "[]").map(
                      (
                        item: { name: string; quantity: string },
                        index: number
                      ) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => {
                              const items = JSON.parse(
                                formData.menuItems || "[]"
                              );
                              items[index].name = e.target.value;
                              setFormData({
                                ...formData,
                                menuItems: JSON.stringify(items),
                              });
                            }}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Quantity"
                            value={item.quantity}
                            onChange={(e) => {
                              const items = JSON.parse(
                                formData.menuItems || "[]"
                              );
                              items[index].quantity = e.target.value;
                              setFormData({
                                ...formData,
                                menuItems: JSON.stringify(items),
                              });
                            }}
                            className="w-1/3"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const items = JSON.parse(
                                formData.menuItems || "[]"
                              );
                              items.splice(index, 1);
                              setFormData({
                                ...formData,
                                menuItems: JSON.stringify(items),
                              });
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </Button>
                        </div>
                      )
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const items = JSON.parse(formData.menuItems || "[]");
                        items.push({ name: "", quantity: "" });
                        setFormData({
                          ...formData,
                          menuItems: JSON.stringify(items),
                        });
                      }}
                      className="w-full"
                    >
                      Add Menu Item
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="allergens" className="text-sm font-medium">
                    Allergens
                  </label>
                  <div className="space-y-2">
                    {JSON.parse(formData.allergens || "[]").map(
                      (allergen: string, index: number) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Allergen"
                            value={allergen}
                            onChange={(e) => {
                              const allergens = JSON.parse(
                                formData.allergens || "[]"
                              );
                              allergens[index] = e.target.value;
                              setFormData({
                                ...formData,
                                allergens: JSON.stringify(allergens),
                              });
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const allergens = JSON.parse(
                                formData.allergens || "[]"
                              );
                              allergens.splice(index, 1);
                              setFormData({
                                ...formData,
                                allergens: JSON.stringify(allergens),
                              });
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </Button>
                        </div>
                      )
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const allergens = JSON.parse(
                          formData.allergens || "[]"
                        );
                        allergens.push("");
                        setFormData({
                          ...formData,
                          allergens: JSON.stringify(allergens),
                        });
                      }}
                      className="w-full"
                    >
                      Add Allergen
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="nutritionalInfo"
                    className="text-sm font-medium"
                  >
                    Nutritional Info
                  </label>
                  <div className="space-y-2">
                    {(() => {
                      const info = JSON.parse(formData.nutritionalInfo || "{}");
                      return (
                        <>
                          {Object.entries(info).map(([key, value], index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder="Field name (e.g., calories, protein)"
                                value={key}
                                onChange={(e) => {
                                  const newInfo = { ...info };
                                  delete newInfo[key];
                                  newInfo[e.target.value] = value;
                                  setFormData({
                                    ...formData,
                                    nutritionalInfo: JSON.stringify(newInfo),
                                  });
                                }}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Value (e.g., 300, 30g)"
                                value={value as string}
                                onChange={(e) => {
                                  const newInfo = {
                                    ...info,
                                    [key]: e.target.value,
                                  };
                                  setFormData({
                                    ...formData,
                                    nutritionalInfo: JSON.stringify(newInfo),
                                  });
                                }}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  const newInfo = { ...info };
                                  delete newInfo[key];
                                  setFormData({
                                    ...formData,
                                    nutritionalInfo: JSON.stringify(newInfo),
                                  });
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const info = JSON.parse(
                                formData.nutritionalInfo || "{}"
                              );
                              const newKey = `field${
                                Object.keys(info).length + 1
                              }`;
                              setFormData({
                                ...formData,
                                nutritionalInfo: JSON.stringify({
                                  ...info,
                                  [newKey]: "",
                                }),
                              });
                            }}
                            className="w-full"
                          >
                            Add Nutritional Field
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">
                    Notes
                  </label>
                  <Input
                    id="notes"
                    placeholder="Notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    required
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Meal Plan"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isMobile ? (
          // Mobile Card View
          <div className="space-y-4">
            {mealPlans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No meal plans found
              </div>
            ) : (
              mealPlans.map((mealPlan) => (
                <div
                  key={mealPlan.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">
                        {mealPlan.mealDate}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {mealPlan.mealType}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        mealPlan.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {mealPlan.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Menu Items:</span>{" "}
                    {JSON.parse(mealPlan.menuItems).map(
                      (item: { name: string; quantity: string }) => (
                        <div key={item.name} className="text-sm">
                          {item.name} ({item.quantity})
                        </div>
                      )
                    )}
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Allergens:</span>{" "}
                    {JSON.parse(mealPlan.allergens).join(", ")}
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Nutritional Info:</span>{" "}
                    {(() => {
                      const info = JSON.parse(mealPlan.nutritionalInfo);
                      return (
                        <div className="mt-1">
                          {Object.entries(info).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              {key}: {value as string}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {mealPlan.notes}
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Created At:</span>{" "}
                    {new Date(mealPlan.createdAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Updated At:</span>{" "}
                    {new Date(mealPlan.updatedAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(mealPlan)}
                      className="flex-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={mealPlan.isActive ? "destructive" : "default"}
                      size="icon"
                      onClick={() => handleToggleActive(mealPlan)}
                      className="flex-1"
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Desktop Table View
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold w-[120px]">
                    Meal Date
                  </TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell w-[120px]">
                    Meal Type
                  </TableHead>
                  <TableHead className="font-semibold hidden md:table-cell w-[200px]">
                    Menu Items
                  </TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell w-[150px]">
                    Allergens
                  </TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell w-[150px]">
                    Nutritional Info
                  </TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell w-[150px]">
                    Notes
                  </TableHead>
                  <TableHead className="font-semibold w-[100px]">
                    Status
                  </TableHead>
                  <TableHead className="text-right font-semibold w-[120px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mealPlans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      No meal plans found
                    </TableCell>
                  </TableRow>
                ) : (
                  mealPlans.map((mealPlan) => (
                    <TableRow key={mealPlan.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium whitespace-nowrap">
                        <div>
                          <div>{mealPlan.mealDate}</div>
                          <div className="text-sm text-gray-500 sm:hidden">
                            {mealPlan.mealType}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell whitespace-nowrap">
                        {mealPlan.mealType}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          {JSON.parse(mealPlan.menuItems).map(
                            (item: { name: string; quantity: string }) => (
                              <div
                                key={item.name}
                                className="text-sm flex items-center gap-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                {item.name} ({item.quantity})
                              </div>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="max-w-[150px] truncate">
                          {JSON.parse(mealPlan.allergens).join(", ")}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="space-y-1">
                          {(() => {
                            const info = JSON.parse(mealPlan.nutritionalInfo);
                            return (
                              <div className="text-sm">
                                {Object.entries(info).map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                    {key}: {value as string}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="max-w-[150px] truncate">
                          {mealPlan.notes}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            mealPlan.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {mealPlan.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(mealPlan)}
                            className="text-gray-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={
                              mealPlan.isActive ? "destructive" : "default"
                            }
                            size="icon"
                            onClick={() => handleToggleActive(mealPlan)}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600">
                Are you sure you want to{" "}
                {mealPlanToDelete?.isActive ? "deactivate" : "activate"} this
                meal plan?
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setMealPlanToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant={mealPlanToDelete?.isActive ? "destructive" : "default"}
                onClick={confirmDelete}
              >
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
