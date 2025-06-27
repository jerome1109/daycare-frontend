import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import "@/app/globals.css";

const MealPlanPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Meal Plan</h1>

      <Card className="mb-4 p-4">
        {/* Add filtering options here, e.g., date range, child selection */}
        <div className="flex items-center space-x-2">
          <label htmlFor="date">Select Date:</label>
          <input type="date" id="date" className="border rounded p-1" />
          <Button>Filter</Button>
        </div>
      </Card>

      <Card className="p-4">
        {/* Display the meal plan here */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Example Meal Items (replace with actual data) */}
          <MealItem
            mealName="Breakfast"
            description="Cereal with milk and fruit"
          />
          <MealItem
            mealName="Lunch"
            description="Sandwich with veggies and fruit"
          />
          <MealItem mealName="Snack" description="Yogurt and crackers" />
          {/* ... more meal items ... */}
        </div>
      </Card>
    </div>
  );
};

const MealItem: React.FC<{ mealName: string; description: string }> = ({
  mealName,
  description,
}) => {
  return (
    <Card className="p-3">
      <h3 className="font-semibold">{mealName}</h3>
      <p>{description}</p>
    </Card>
  );
};

export default MealPlanPage;
