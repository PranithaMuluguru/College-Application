// Mess menu data that alternates between week 1 and week 2
export const messMenu = {
  "week1": {
    "Monday": {
      "Breakfast": "Poha",
      "Lunch": "Thali",
      "Dinner": "Paneer"
    },
    "Tuesday": {
      "Breakfast": "Idli",
      "Lunch": "Rice Plate",
      "Dinner": "Chole"
    },
    "Wednesday": {
      "Breakfast": "Sandwich",
      "Lunch": "Rajma Chawal",
      "Dinner": "Kadhai Paneer"
    },
    "Thursday": {
      "Breakfast": "Paratha",
      "Lunch": "Chole Bhature",
      "Dinner": "Mix Veg"
    },
    "Friday": {
      "Breakfast": "Upma",
      "Lunch": "Butter Chicken",
      "Dinner": "Fried Rice"
    },
    "Saturday": {
      "Breakfast": "Dosa",
      "Lunch": "Biryani",
      "Dinner": "Pav Bhaji"
    },
    "Sunday": {
      "Breakfast": "Aloo Paratha",
      "Lunch": "Special Thali",
      "Dinner": "Pizza"
    }
  },
  "week2": {
    "Monday": {
      "Breakfast": "Upma",
      "Lunch": "North Indian Thali",
      "Dinner": "Dal Makhani"
    },
    "Tuesday": {
      "Breakfast": "Paratha",
      "Lunch": "South Indian Thali",
      "Dinner": "Butter Chicken"
    },
    "Wednesday": {
      "Breakfast": "Cornflakes",
      "Lunch": "Kadhai Paneer",
      "Dinner": "Noodles"
    },
    "Thursday": {
      "Breakfast": "Poha",
      "Lunch": "Chole Rice",
      "Dinner": "Malai Kofta"
    },
    "Friday": {
      "Breakfast": "Sandwich",
      "Lunch": "Fish Curry",
      "Dinner": "Pulao"
    },
    "Saturday": {
      "Breakfast": "Idli",
      "Lunch": "Mutton Biryani",
      "Dinner": "Manchurian"
    },
    "Sunday": {
      "Breakfast": "Poori Sabji",
      "Lunch": "Special Lunch",
      "Dinner": "Pasta"
    }
  }
};

export const getTodaysMenu = () => {
  // Determine if it's week 1 or week 2
  const weekNumber = Math.floor((new Date().getDate() - 1) / 7) % 2 + 1;
  const weekKey = `week${weekNumber}`;
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  return messMenu[weekKey][day] || {
    "Breakfast": "Not available",
    "Lunch": "Not available",
    "Dinner": "Not available"
  };
};

export const getWeeklyMenu = () => {
  const weekNumber = Math.floor((new Date().getDate() - 1) / 7) % 2 + 1;
  const weekKey = `week${weekNumber}`;
  return messMenu[weekKey];
};