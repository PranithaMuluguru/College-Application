export const clubCategories = [
    { id: 'sports', name: 'Sports Clubs', icon: '🏆' },
    { id: 'tech', name: 'Tech Clubs', icon: '💻' },
    { id: 'cultural', name: 'Cultural Clubs', icon: '🎭' },
    { id: 'academic', name: 'Academic Clubs', icon: '📚' },
    { id: 'arts', name: 'Arts Clubs', icon: '🎨' },
    { id: 'social', name: 'Social Clubs', icon: '🤝' }
  ];
  
  export const clubs = {
    sports: [
      {
        id: 1,
        name: "Football Club",
        description: "For football enthusiasts. Regular practice sessions and inter-college tournaments.",
        members: 45,
        president: "Raj Sharma",
        contact: "football@college.edu",
        announcements: [
          {
            id: 1,
            title: "Practice Session Tomorrow",
            content: "Practice session at 4 PM in main ground. Bring your gear!",
            date: "2023-10-15",
            author: "Coach Singh"
          },
          {
            id: 2,
            title: "Tournament Registration Open",
            content: "Inter-college tournament registration starts next week.",
            date: "2023-10-10",
            author: "Sports Dept"
          }
        ]
      },
      {
        id: 2,
        name: "Basketball Team",
        description: "College basketball team. Competitive players welcome.",
        members: 28,
        president: "Priya Patel",
        contact: "basketball@college.edu",
        announcements: [
          {
            id: 1,
            title: "Tryouts Next Week",
            content: "Basketball team tryouts on Monday at 5 PM.",
            date: "2023-10-18",
            author: "Coach Kumar"
          }
        ]
      },
      {
        id: 3,
        name: "Cricket Club",
        description: "Cricket practice and friendly matches.",
        members: 52,
        president: "Amit Verma",
        contact: "cricket@college.edu",
        announcements: []
      }
    ],
    tech: [
      {
        id: 4,
        name: "Coding Club",
        description: "Learn programming, participate in hackathons and coding competitions.",
        members: 120,
        president: "Neha Gupta",
        contact: "coding@college.edu",
        announcements: [
          {
            id: 1,
            title: "Hackathon Announcement",
            content: "Annual hackathon on November 15th. Register now!",
            date: "2023-10-12",
            author: "Tech Committee"
          }
        ]
      },
      {
        id: 5,
        name: "Robotics Club",
        description: "Build robots and participate in robotics competitions.",
        members: 35,
        president: "Arjun Mehta",
        contact: "robotics@college.edu",
        announcements: []
      }
    ],
    cultural: [
      {
        id: 6,
        name: "Music Society",
        description: "For music lovers and performers. Various instruments and vocal groups.",
        members: 65,
        president: "Sonia Kapoor",
        contact: "music@college.edu",
        announcements: []
      },
      {
        id: 7,
        name: "Dance Club",
        description: "Learn various dance forms and perform at college events.",
        members: 78,
        president: "Rahul Desai",
        contact: "dance@college.edu",
        announcements: []
      }
    ]
  };
  
  export const userJoinedClubs = [1, 4]; // Example: User has joined Football and Coding clubs
  
  // Join a club
  export const joinClub = (clubId) => {
    if (!userJoinedClubs.includes(clubId)) {
      userJoinedClubs.push(clubId);
      return true;
    }
    return false;
  };
  
  // Leave a club
  export const leaveClub = (clubId) => {
    const index = userJoinedClubs.indexOf(clubId);
    if (index > -1) {
      userJoinedClubs.splice(index, 1);
      return true;
    }
    return false;
  };
  
  // Check if user has joined a club
  export const hasJoinedClub = (clubId) => {
    return userJoinedClubs.includes(clubId);
  };
  
  // Get all announcements from joined clubs
  export const getMyAnnouncements = () => {
    const announcements = [];
    userJoinedClubs.forEach(clubId => {
      Object.values(clubs).forEach(category => {
        category.forEach(club => {
          if (club.id === clubId) {
            club.announcements.forEach(announcement => {
              announcements.push({
                ...announcement,
                clubName: club.name,
                category: Object.keys(clubs).find(key => clubs[key].includes(club))
              });
            });
          }
        });
      });
    });
    return announcements.sort((a, b) => new Date(b.date) - new Date(a.date));
  };