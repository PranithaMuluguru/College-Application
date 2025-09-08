// Sample timetable data
export const timetable = {
  "Monday": [
    { id: 1, name: "Data Structures", time: "10:00 AM", location: "Room 101" },
    { id: 2, name: "Algorithms", time: "2:00 PM", location: "Room 102" }
  ],
  "Tuesday": [
    { id: 1, name: "Database Systems", time: "10:00 PM", location: "Room 103" },
    { id: 2, name: "Web Development", time: "1:00 PM", location: "Lab 201" }
  ],
  "Wednesday": [
    { id: 1, name: "Operating Systems", time: "11:00 AM", location: "Room 104" },
    { id: 2, name: "Computer Networks", time: "3:00 PM", location: "Lab 202" }
  ],
  "Thursday": [
    { id: 1, name: "Software Engineering", time: "10:00 AM", location: "Room 105" },
    { id: 2, name: "AI Fundamentals", time: "2:00 PM", location: "Room 106" }
  ],
  "Friday": [
    { id: 1, name: "Mobile App Development", time: "9:00 AM", location: "Lab 203" },
    { id: 2, name: "Cloud Computing", time: "1:00 PM", location: "Room 107" }
  ],
  "Saturday": [],
  "Sunday": []
};

export const getNextClass = () => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = days[new Date().getDay()];
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  // Get today's classes
  const todayClasses = timetable[today] || [];
  
  // Find the next class today
  for (let cls of todayClasses) {
    const [time, modifier] = cls.time.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    const classTime = hours * 60 + minutes;
    
    if (classTime > currentTime) {
      return { ...cls, day: today };
    }
  }
  
  // If no more classes today, get first class of next day
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (new Date().getDay() + i) % 7;
    const nextDay = days[nextDayIndex];
    const nextDayClasses = timetable[nextDay] || [];
    
    if (nextDayClasses.length > 0) {
      return { ...nextDayClasses[0], day: nextDay };
    }
  }
  
  return null;
};