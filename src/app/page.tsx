"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { format, parseISO, startOfWeek, eachDayOfInterval, addDays, isSameDay, isAfter, subDays } from 'date-fns';
import _ from 'lodash';
import React from 'react'; // Import React for type definitions like React.MouseEvent
import Image from 'next/image';

// Types
type Habit = {
  id: string;
  name: string;
  icon: string;
  currentStreak: number;
  longestStreak: number;
  goal: number;
  unit: string;
  entries: Entry[];
  color: string;
  category: 'health' | 'productivity' | 'self-care' | 'fitness';
};

type Entry = {
  date: string;
  value: number;
  completed: boolean;
};

type User = {
  name: string;
  avatar?: string; // Make avatar optional
  joinDate: string;
  totalHabitsCompleted: number;
  currentStreak: number;
  longestStreak: number;
};

// Get random number between min and max
const getRandomValue = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate realistic mock data for the last 30 days
const generateMockEntries = (goal: number, consistency = 0.8): Entry[] => {
  const entries: Entry[] = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    const completed = Math.random() < consistency;
    const value = completed ? getRandomValue(Math.floor(goal * 0.7), goal + Math.floor(goal * 0.3)) : getRandomValue(0, Math.floor(goal * 0.6));
    
    entries.unshift({
      date: date.toISOString(),
      value,
      completed: value >= goal
    });
  }
  
  return entries;
};

// Calculate streak
const calculateStreak = (entries: Entry[]): number => {
  let streak = 0;
  const today = new Date();
  let currentDate = subDays(today, 1); // Start with yesterday
  
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    const entryDate = parseISO(entry.date);
    
    // If the entry is not for the current date we're checking, break the streak
    if (!isSameDay(entryDate, currentDate)) {
      break;
    }
    
    // If the entry was completed, increment the streak
    if (entry.completed) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }
  
  return streak;
};

// Initial habits data
const initialHabits: Habit[] = [
  { // Moved to top
    id: '7',
    name: 'Hire Anshul Rastogi',
    icon: '🚀',
    currentStreak: 1, // Assuming completed today for the initial state
    longestStreak: 1,
    goal: 1,
    unit: 'HIRED',
    // Start with only today's entry, marked as complete
    entries: [{ date: new Date().toISOString(), value: 1, completed: true }],
    color: '#FFD700', // Gold color
    category: 'productivity'
  },
  {
    id: '1',
    name: 'Water Intake',
    icon: '💧',
    currentStreak: 0,
    longestStreak: 14,
    goal: 8,
    unit: 'glasses',
    entries: generateMockEntries(8, 0.9),
    color: '#3B82F6',
    category: 'health'
  },
  {
    id: '2',
    name: 'Sleep',
    icon: '😴',
    currentStreak: 0,
    longestStreak: 21,
    goal: 8,
    unit: 'hours',
    entries: generateMockEntries(8, 0.85),
    color: '#8B5CF6',
    category: 'health'
  },
  {
    id: '3',
    name: 'Screen Time',
    icon: '📱',
    currentStreak: 0,
    longestStreak: 5,
    goal: 2,
    unit: 'hours',
    entries: generateMockEntries(2, 0.65),
    color: '#EC4899',
    category: 'productivity'
  },
  {
    id: '4',
    name: 'Meditation',
    icon: '🧘',
    currentStreak: 0,
    longestStreak: 10,
    goal: 20,
    unit: 'minutes',
    entries: generateMockEntries(20, 0.75),
    color: '#10B981',
    category: 'self-care'
  },
  {
    id: '5',
    name: 'Reading',
    icon: '📚',
    currentStreak: 0,
    longestStreak: 7,
    goal: 30,
    unit: 'minutes',
    entries: generateMockEntries(30, 0.7),
    color: '#F59E0B',
    category: 'self-care'
  },
  {
    id: '6',
    name: 'Exercise',
    icon: '🏃',
    currentStreak: 0,
    longestStreak: 12,
    goal: 45,
    unit: 'minutes',
    entries: generateMockEntries(45, 0.65),
    color: '#EF4444',
    category: 'fitness'
  }
];

// Initialize user data
const initialUser: User = {
  name: 'Sachin Gurjar', // Updated Name
  // avatar: 'https://randomuser.me/api/portraits/men/32.jpg', // Removed default avatar
  joinDate: new Date(2023, 9, 15).toISOString(),
  totalHabitsCompleted: 142,
  currentStreak: 0,
  longestStreak: 24
};

// Calculate longest streak for each habit and update the habits
const updateHabitsStreaks = (habits: Habit[]): Habit[] => {
  return habits.map(habit => {
    const streak = calculateStreak(habit.entries);
    return {
      ...habit,
      currentStreak: streak,
      longestStreak: Math.max(streak, habit.longestStreak)
    };
  });
};

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [user, setUser] = useState<User>(initialUser);
  const [activeHabit, setActiveHabit] = useState<Habit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<'settings' | 'profile' | 'add-habit' | 'edit-habit'>('settings');
  const [newHabit, setNewHabit] = useState<Partial<Habit>>({
    name: '',
    icon: '✅',
    goal: 1,
    unit: '',
    category: 'health',
    color: '#3B82F6'
  });
  const [todayEntry, setTodayEntry] = useState<Entry | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'habits' | 'analytics'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showReminders, setShowReminders] = useState(true);
  
  // For modifying habit values
  const [habitValue, setHabitValue] = useState(0);
  const [dashboardInputValue, setDashboardInputValue] = useState<Record<string, number>>({}); // State for dashboard inputs
  
  // Refs for animations
  const searchRef = useRef<HTMLInputElement>(null);
  
  // Initialize data
  useEffect(() => {
    const updatedHabits = updateHabitsStreaks(initialHabits);
    setHabits(updatedHabits);
    
    // Calculate user's current streak
    const userStreak = calculateUserStreak(updatedHabits);
    setUser({
      ...initialUser,
      currentStreak: userStreak
    });
    
    // Show welcome notification
    showNotificationMessage('Welcome back! You have habits to track today.');
    
    // Check if there are any habits that need attention
    const habitsNeedingAttention = updatedHabits.filter(habit => {
      const latestEntry = habit.entries[habit.entries.length - 1];
      const today = new Date();
      return !latestEntry.completed && isSameDay(parseISO(latestEntry.date), today);
    });
    
    if (habitsNeedingAttention.length > 0) {
      setTimeout(() => {
        showNotificationMessage(`You have ${habitsNeedingAttention.length} habits that need attention today!`);
      }, 5000);
    }
    
    // Add event listener for keyboard shortcuts
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl/Cmd + / to open search
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      if (searchRef.current) {
        searchRef.current.focus();
      }
    }
    
    // Escape to close modal
    if (e.key === 'Escape' && isModalOpen) {
      closeModal();
    }
  };
  
  // Calculate user streak based on having at least one habit completed each day
  const calculateUserStreak = (habits: Habit[]): number => {
    let streak = 0;
    const today = new Date();
    let currentDate = subDays(today, 1); // Start with yesterday
    
    // Check for 30 days back
    for (let day = 0; day < 30; day++) {
      const dateToCheck = subDays(today, day);
      
      // Check if any habit was completed on this date
      const anyCompleted = habits.some(habit => {
        const entry = habit.entries.find(e => isSameDay(parseISO(e.date), dateToCheck));
        return entry && entry.completed;
      });
      
      if (anyCompleted) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };
  
  // Show notification message
  const showNotificationMessage = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };
  
  // Handle habit log update
  const updateHabitLog = (habit: Habit, value: number) => {
    const today = new Date();
    const todayISOString = today.toISOString();
    
    // Find today's entry or create it
    const existingEntryIndex = habit.entries.findIndex(entry => 
      isSameDay(parseISO(entry.date), today)
    );
    
    const newEntries = [...habit.entries];
    const completed = value >= habit.goal;
    
    if (existingEntryIndex >= 0) {
      // Update existing entry
      newEntries[existingEntryIndex] = {
        ...newEntries[existingEntryIndex],
        value,
        completed
      };
    } else {
      // Add new entry for today
      newEntries.push({
        date: todayISOString,
        value,
        completed
      });
    }
    
    // Update habit with new entries
    const updatedHabit = {
      ...habit,
      entries: newEntries
    };
    
    // Update habits state
    const updatedHabits = habits.map(h => 
      h.id === habit.id ? updatedHabit : h
    );
    
    // Recalculate streaks
    const habitsWithUpdatedStreaks = updateHabitsStreaks(updatedHabits);
    setHabits(habitsWithUpdatedStreaks);
    
    // Update dashboard input state if the update came from there
    if (dashboardInputValue[habit.id] !== undefined) {
       setDashboardInputValue(prev => ({ ...prev, [habit.id]: value }));
    }
    
    // Update user streak
    const userStreak = calculateUserStreak(habitsWithUpdatedStreaks);
    setUser({
      ...user,
      currentStreak: userStreak,
      longestStreak: Math.max(userStreak, user.longestStreak),
      totalHabitsCompleted: user.totalHabitsCompleted + (completed ? 1 : 0)
    });
    
    if (completed && !habit.entries[existingEntryIndex]?.completed) {
      showNotificationMessage(`🎉 Great job! You've completed your ${habit.name} goal!`);
    }
    
    // If this is the habit being displayed in detail view, update activeHabit
    if (activeHabit && activeHabit.id === habit.id) {
      const updatedActiveHabit = habitsWithUpdatedStreaks.find(h => h.id === habit.id);
      if (updatedActiveHabit) {
        setActiveHabit(updatedActiveHabit);
      }
    }
  };
  
  // Open modal with specific content
  const openModal = (content: 'settings' | 'profile' | 'add-habit' | 'edit-habit') => {
    setModalContent(content);
    setIsModalOpen(true);
  };
  
  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  // Handle habit selection for detailed view
  const handleHabitSelect = (habit: Habit) => {
    setActiveHabit(habit);
    
    // Get today's entry or create a placeholder
    const today = new Date();
    const todayEntry = habit.entries.find(entry => 
      isSameDay(parseISO(entry.date), today)
    ) || {
      date: today.toISOString(),
      value: 0,
      completed: false
    };
    
    setTodayEntry(todayEntry);
    setHabitValue(todayEntry.value);
    
    // Switch to the habits tab to show the detail view
    setActiveTab('habits');
  };
  
  // Handle adding a new habit
  const handleAddHabit = () => {
    if (!newHabit.name || !newHabit.unit) {
      showNotificationMessage('Please fill out all required fields');
      return;
    }
    
    const habitId = (habits.length + 1).toString();
    const newHabitComplete: Habit = {
      id: habitId,
      name: newHabit.name || '',
      icon: newHabit.icon || '✅',
      currentStreak: 0,
      longestStreak: 0,
      goal: newHabit.goal || 1,
      unit: newHabit.unit || '',
      entries: generateMockEntries(newHabit.goal || 1, 0.7),
      color: newHabit.color || '#3B82F6',
      category: newHabit.category as 'health' | 'productivity' | 'self-care' | 'fitness'
    };
    
    setHabits([...habits, newHabitComplete]);
    setNewHabit({
      name: '',
      icon: '✅',
      goal: 1,
      unit: '',
      category: 'health',
      color: '#3B82F6'
    });
    
    closeModal();
    showNotificationMessage(`New habit "${newHabitComplete.name}" added successfully!`);
  };
  
  // Handle editing a habit
  const handleEditHabit = () => {
    if (!activeHabit) return;
    
    const updatedHabit = {
      ...activeHabit,
      name: newHabit.name || activeHabit.name,
      icon: newHabit.icon || activeHabit.icon,
      goal: newHabit.goal || activeHabit.goal,
      unit: newHabit.unit || activeHabit.unit,
      color: newHabit.color || activeHabit.color,
      category: newHabit.category as 'health' | 'productivity' | 'self-care' | 'fitness' || activeHabit.category
    };
    
    setHabits(habits.map(h => h.id === activeHabit.id ? updatedHabit : h));
    setActiveHabit(updatedHabit);
    closeModal();
    showNotificationMessage(`Habit "${updatedHabit.name}" updated successfully!`);
  };
  
  // Handle deleting a habit
  const handleDeleteHabit = (habitId: string) => {
    setHabits(habits.filter(habit => habit.id !== habitId));
    if (activeHabit && activeHabit.id === habitId) {
      setActiveHabit(null);
    }
    showNotificationMessage('Habit deleted successfully');
  };
  
  // Prepare data for weekly chart
  const prepareWeeklyData = (habit: Habit) => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    
    const weekDays = eachDayOfInterval({
      start: startOfCurrentWeek,
      end: addDays(startOfCurrentWeek, 6)
    });
    
    return weekDays.map((day: Date) => {
      const entry = habit.entries.find(e => isSameDay(parseISO(e.date), day));
      return {
        day: format(day, 'EEE'),
        value: entry ? entry.value : 0,
        goal: habit.goal
      };
    });
  };
  
  // Get weekly completion rate
  const getWeeklyCompletionRate = (habit: Habit) => {
    const today = new Date();
    const oneWeekAgo = subDays(today, 7);
    
    const recentEntries = habit.entries.filter(entry => 
      isAfter(parseISO(entry.date), oneWeekAgo)
    );
    
    if (recentEntries.length === 0) return 0;
    
    const completedCount = recentEntries.filter(entry => entry.completed).length;
    return Math.round((completedCount / recentEntries.length) * 100);
  };
  
  // Prepare data for category breakdown chart
  const prepareCategoryData = () => {
    const categoryCounts = _.groupBy(habits, 'category');
    
    // Added type assertion for categoryHabits
    return Object.entries(categoryCounts).map(([category, categoryHabits]: [string, unknown]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: (categoryHabits as Habit[]).length
    }));
  };
  
  // Calculate overall completion rate
  const calculateOverallCompletionRate = () => {
    if (habits.length === 0) return 0;
    
    const completionRates = habits.map(getWeeklyCompletionRate);
    return Math.round(completionRates.reduce((sum, rate) => sum + rate, 0) / habits.length);
  };
  
  // Filter habits based on search and category
  const filteredHabits = habits.filter(habit => {
    const matchesSearch = habit.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || habit.category === filterCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Handle habit value change (now generic for dashboard and detail view)
  const handleHabitValueChange = (habit: Habit, value: number) => {
    // Ensure value is not negative
    const nonNegativeValue = Math.max(0, value); 
    
    if (activeHabit && habit.id === activeHabit.id) {
      setHabitValue(nonNegativeValue); // Update detail view state if active
    }
    updateHabitLog(habit, nonNegativeValue); // Update the actual log
  };
  
  // Get CSS class based on habit completion percentage
  const getCompletionClass = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Render weekly progress chart
  const renderWeeklyChart = (habit: Habit) => {
    const weeklyData = prepareWeeklyData(habit);
    
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={weeklyData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip
            contentStyle={{ 
              background: isDarkMode ? '#1F2937' : '#fff', // Keep tooltip contrast
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}
            formatter={(value: number) => [`${value} ${habit.unit}`, 'Value']}
          />
          <Legend />
          <Bar dataKey="value" fill={habit.color} radius={[4, 4, 0, 0]} name="Actual" />
          <Bar dataKey="goal" fill="#9CA3AF" radius={[4, 4, 0, 0]} name="Goal" />
        </BarChart>
      </ResponsiveContainer>
    );
  };
  
  // Render habit trends chart
  const renderTrendsChart = (habit: Habit) => {
    // Get last 14 days of data
    const last14Days = habit.entries.slice(-14);
    const trendData = last14Days.map(entry => ({
      date: format(parseISO(entry.date), 'MMM d'),
      value: entry.value
    }));
    
    return (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            contentStyle={{ 
              background: isDarkMode ? '#1F2937' : '#fff', // Keep tooltip contrast
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}
            formatter={(value: number) => [`${value} ${habit.unit}`, 'Value']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={habit.color}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  // Render habits by category chart
  const renderCategoryPieChart = () => {
    const categoryData = prepareCategoryData();
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899'];
    
    return (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }: { name: string, percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: isDarkMode ? '#1F2937' : '#fff',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
            // Explicitly set item text color for dark mode
            itemStyle={{ color: isDarkMode ? '#e5e7eb' : '#1f2937' }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };
  
  // Format dates for display
  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  };
  
  return (
    // This is the opening tag of the main wrapper div
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-900'}`}> 
      
      {/* Navbar */}
      <header className={`py-4 px-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} shadow-md sticky top-0 z-30`}> {/* Navbar slightly lighter than pure black */}
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="text-2xl"
            >
              📊
            </motion.div>
            <h1 className="text-xl font-bold">HabitTracker</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-md ${activeTab === 'dashboard' ? 
                (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800') : 
                (isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('habits')}
              className={`px-3 py-2 rounded-md ${activeTab === 'habits' ? 
                (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800') : 
                (isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')}`}
            >
              My Habits
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-2 rounded-md ${activeTab === 'analytics' ? 
                (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800') : 
                (isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')}`}
            >
              Analytics
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Conditionally render search bar only on Habits tab */}
            {activeTab === 'habits' && (
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search habits... (Ctrl+/)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-9 pr-4 py-2 rounded-lg w-64 ${
                      isDarkMode ? 'bg-gray-700 text-gray-100 placeholder-gray-400 focus:bg-gray-600' : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:bg-white'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500">🔍</span>
                </motion.div>
              </div>
            )}
            
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => openModal('profile')}
                className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-blue-500 dark:border-blue-400 overflow-hidden bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-black"
                title="View Profile"
              >
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt="User Avatar"
                    width={40} // Required for next/image
                    height={40} // Required for next/image
                    className="object-cover" // Ensures image covers the area
                  />
                ) : (
                  // Fallback initials or icon
                  <span>{user.name.charAt(0)}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg"> {/* Slightly lighter bg */}
        <div className="flex justify-between px-6 py-3">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center ${activeTab === 'dashboard' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <span className="text-lg">🏠</span>
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('habits')}
            className={`flex flex-col items-center ${activeTab === 'habits' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <span className="text-lg">✅</span>
            <span className="text-xs mt-1">Habits</span>
          </button>
          <button 
            onClick={() => openModal('add-habit')}
            className="flex flex-col items-center bg-blue-600 text-white rounded-full p-2 -mt-6 shadow-lg"
          >
            <span className="text-lg">+</span>
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center ${activeTab === 'analytics' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <span className="text-lg">📊</span>
            <span className="text-xs mt-1">Analytics</span>
          </button>
          <button 
            onClick={() => openModal('settings')}
            className="flex flex-col items-center text-gray-500 dark:text-gray-400"
          >
            <span className="text-lg">⚙️</span>
            <span className="text-xs mt-1">Settings</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 pb-20 md:pb-10">
        {/* Toast Notification */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.4 }}
              className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${isDarkMode ? 'bg-gray-800 border-blue-500' : 'bg-white border-blue-500'} border-l-4`} // Consistent border color
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 text-blue-500">
                  <span className="text-xl">ℹ️</span>
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {notificationMessage}
                  </p>
                </div>
                <button
                  onClick={() => setShowNotification(false)}
                  className={`ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
                >
                  <span className="sr-only">Close</span>
                  <span>×</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="py-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Welcome back, {user.name}!</h2>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Today is {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  onClick={() => openModal('add-habit')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition duration-300"
                >
                  <span>+</span>
                  <span>Add Habit</span>
                </button>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`p-6 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Current Streak</h3>
                  <span className="text-xl">🔥</span>
                </div>
                <p className="text-3xl font-bold text-blue-500 dark:text-blue-400">{user.currentStreak} days</p>
                <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user.currentStreak > 0
                    ? `Keep it up! You're on a roll!`
                    : `Start your streak today!`}
                </p>
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`p-6 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Completion Rate</h3>
                  <span className="text-xl">📈</span>
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{calculateOverallCompletionRate()}%</p>
                <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Weekly average across all habits
                </p>
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`p-6 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Total Completed</h3>
                  <span className="text-xl">🏆</span>
                </div>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{user.totalHabitsCompleted}</p>
                <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Habit goals achieved since joining
                </p>
              </motion.div>
            </div>
            
            {/* Today's Progress */}
            <div className={`p-6 rounded-xl shadow-md mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Todays Progress</h3>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  {format(new Date(), 'EEE, MMM d')}
                </p>
              </div>
              
              {habits.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-lg">You haven't added any habits yet.</p>
                  <button
                    onClick={() => openModal('add-habit')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Add Your First Habit
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {habits.map(habit => {
                    const todayEntry = habit.entries.find(entry => 
                      isSameDay(parseISO(entry.date), new Date())
                    ) || { date: new Date().toISOString(), value: 0, completed: false }; // Ensure todayEntry exists
                    
                    // Use local state for controlled input, initialized from todayEntry
                    const currentValue = dashboardInputValue[habit.id] ?? todayEntry.value;
                    
                    const percentage = Math.min(100, Math.round((currentValue / habit.goal) * 100));
                    
                    return (
                      // Adjusted hover color for light mode
                      <div key={habit.id} className={`flex flex-col p-3 rounded-lg transition-colors duration-200 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleHabitSelect(habit)} title="View Details">
                            <span className="text-xl">{habit.icon}</span>
                            <h4 className="font-medium">{habit.name}</h4>
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                             {currentValue} / {habit.goal} {habit.unit}
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div 
                           className={`w-full h-2 rounded-full mb-3 overflow-hidden ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`} 
                           onClick={() => handleHabitSelect(habit)}
                           title="View Details"
                           style={{ cursor: 'pointer' }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full rounded-full ${getCompletionClass(currentValue, habit.goal)}`}
                          ></motion.div>
                        </div>

                        {/* Quick Log Controls */}
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => handleHabitValueChange(habit, currentValue - (habit.unit === 'hours' ? 0.5 : 1))} 
                             className={`px-2 py-1 rounded-md text-sm ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                             disabled={currentValue <= 0}
                           >
                             -
                           </button>
                           <input 
                             type="number" 
                             value={currentValue} 
                             onChange={(e) => {
                               const val = parseFloat(e.target.value) || 0;
                               setDashboardInputValue(prev => ({ ...prev, [habit.id]: val })); // Update local state first
                               // Optional: Debounce updateHabitLog if needed for performance
                               updateHabitLog(habit, Math.max(0, val)); 
                             }}
                             min="0"
                             step={habit.unit === 'hours' ? 0.1 : 1}
                             className={`w-16 px-2 py-1 rounded-md text-sm text-center ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                           />
                           <button 
                             onClick={() => handleHabitValueChange(habit, currentValue + (habit.unit === 'hours' ? 0.5 : 1))} 
                             className={`px-2 py-1 rounded-md text-sm ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                           >
                             +
                           </button>
                           <button 
                             onClick={() => handleHabitValueChange(habit, habit.goal)} 
                             className={`px-3 py-1 rounded-md text-sm text-white ${currentValue >= habit.goal ? 'bg-green-500' : 'bg-green-600 hover:bg-green-700'} transition-colors`}
                             disabled={currentValue >= habit.goal}
                             title="Mark as Complete"
                           >
                             ✓
                           </button>
                        </div>
                      </div>
                    );
                  })}
                  {/* Show message if search yields no results */}
                  {habits.filter(habit => habit.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && searchQuery && (
                    <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No habits found matching "{searchQuery}".
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Habit Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className={`p-6 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-xl font-bold mb-6">Habits by Category</h3>
                {habits.length > 0 ? (
                  renderCategoryPieChart()
                ) : (
                  <div className="h-52 flex items-center justify-center">
                    <p>No data to display</p>
                  </div>
                )}
              </div>
              
              <div className={`p-6 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-xl font-bold mb-6">Weekly Overview</h3>
                {activeHabit ? (
                  renderWeeklyChart(activeHabit)
                ) : habits.length > 0 ? (
                  renderWeeklyChart(habits[0])
                ) : (
                  <div className="h-52 flex items-center justify-center">
                    <p>No data to display</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Reminders Section */}
            {showReminders && habits.some(habit => {
               const todayEntry = habit.entries.find(entry => isSameDay(parseISO(entry.date), new Date()));
               return !todayEntry?.completed;
             }) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-6 rounded-xl shadow-md mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Reminders</h3>
                  <button
                    onClick={() => setShowReminders(false)}
                    className={`p-1 rounded-full ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
                    title="Hide Reminders"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {habits.filter(habit => {
                    const todayEntry = habit.entries.find(entry =>
                      isSameDay(parseISO(entry.date), new Date())
                    );
                    return !todayEntry?.completed;
                  }).slice(0, 3).map(habit => (
                    <div key={`reminder-${habit.id}`} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{habit.icon}</span>
                        <div>
                          <p className="font-medium">{habit.name}</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Goal: {habit.goal} {habit.unit}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleHabitSelect(habit)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Log
                      </button>
                    </div>
                  ))}

                  {habits.filter(habit => {
                    const todayEntry = habit.entries.find(entry =>
                      isSameDay(parseISO(entry.date), new Date())
                    );
                    return !todayEntry?.completed;
                  }).length === 0 && (
                    <div className="text-center py-4">
                      <p>🎉 All habits completed for today!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Habits View */}
        {activeTab === 'habits' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="py-6"
          >
            {/* Conditionally render list or detail view */}
            {activeHabit ? (
              // Habit Detail View
              <motion.div
                key="habit-detail"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setActiveHabit(null)}
                  className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Back to Habits
                </button>

                <div className={`p-6 rounded-xl shadow-md mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-l-4`} style={{ borderLeftColor: activeHabit.color }}>
                   <div className="flex flex-col md:flex-row items-start justify-between mb-6">
                     <div className="flex items-center gap-4 mb-4 md:mb-0">
                       <span className="text-4xl">{activeHabit.icon}</span>
                       <div>
                         <h2 className="text-2xl font-bold">{activeHabit.name}</h2>
                         <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                           Goal: {activeHabit.goal} {activeHabit.unit} daily
                         </p>
                       </div>
                     </div>
                     <div className="flex gap-2">
                         <button
                           onClick={() => {
                             // Pre-fill state for editing
                             setNewHabit({
                               name: activeHabit.name,
                               icon: activeHabit.icon,
                               goal: activeHabit.goal,
                               unit: activeHabit.unit,
                               category: activeHabit.category,
                               color: activeHabit.color
                             });
                             openModal('edit-habit');
                           }}
                           className={`px-3 py-2 rounded-md text-sm flex items-center gap-1 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                         >
                           ✏️ Edit
                         </button>
                         <button
                           onClick={() => {
                             // Confirmation might be good here in a real app
                             handleDeleteHabit(activeHabit.id);
                             setActiveHabit(null); // Go back to list after delete
                           }}
                           className={`px-3 py-2 rounded-md text-sm flex items-center gap-1 text-red-600 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-50 hover:bg-red-100'}`}
                         >
                           🗑️ Delete
                         </button>
                     </div>
                   </div>

                   {/* Log Today's Progress */}
                   <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                      <h3 className="text-lg font-semibold mb-3">Log Today ({format(new Date(), 'MMM d')})</h3>
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                         <div className="flex-grow w-full sm:w-auto">
                           <label htmlFor="habitValueInput" className="sr-only">Enter value</label>
                           <input
                             id="habitValueInput"
                             type="number"
                             min="0"
                             step={activeHabit.unit === 'hours' ? 0.1 : 1} // Smaller steps for hours
                             value={habitValue}
                             onChange={(e) => handleHabitValueChange(activeHabit, parseFloat(e.target.value) || 0)}
                             className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} border border-gray-300 dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                           />
                         </div>
                         <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>/ {activeHabit.goal} {activeHabit.unit}</span>
                         <button
                           onClick={() => handleHabitValueChange(activeHabit, activeHabit.goal)} // Quick complete button
                           className={`px-3 py-2 rounded-lg text-white ${activeHabit.goal === habitValue ? 'bg-green-500' : 'bg-green-600 hover:bg-green-700'} transition duration-200`}
                           disabled={activeHabit.goal === habitValue}
                         >
                           Mark as Complete
                         </button>
                      </div>
                      {todayEntry && (
                         <p className={`mt-3 text-sm ${todayEntry.completed ? 'text-green-600 dark:text-green-400' : (isDarkMode ? 'text-gray-400' : 'text-gray-600')}`}>
                           Status: {todayEntry.completed ? `Completed! 🎉 (Value: ${todayEntry.value})` : `In Progress (Current: ${todayEntry.value})`}
                         </p>
                      )}
                   </div>

                   {/* Streaks */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <p className="text-sm font-medium mb-1">Current Streak</p>
                          <p className="text-2xl font-bold">{activeHabit.currentStreak} days 🔥</p>
                      </div>
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <p className="text-sm font-medium mb-1">Longest Streak</p>
                          <p className="text-2xl font-bold">{activeHabit.longestStreak} days</p>
                      </div>
                   </div>

                   {/* Charts */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div>
                       <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
                       {renderWeeklyChart(activeHabit)}
                     </div>
                     <div>
                       <h3 className="text-lg font-semibold mb-4">Trend (Last 14 Days)</h3>
                       {renderTrendsChart(activeHabit)}
                     </div>
                   </div>
                 </div>
              </motion.div>
            ) : (
              // Habit List View
              <motion.div
                key="habit-list"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">My Habits</h2>
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Track and manage your daily habits
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center gap-3">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className={`px-3 py-2 rounded-lg ${
                        isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                      } border border-gray-300 dark:border-gray-600`}
                    >
                      <option value="all">All Categories</option>
                      <option value="health">Health</option>
                      <option value="productivity">Productivity</option>
                      <option value="self-care">Self-Care</option>
                      <option value="fitness">Fitness</option>
                    </select>
                    
                    <button
                      onClick={() => openModal('add-habit')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition duration-300"
                    >
                      <span>+</span>
                      <span>Add Habit</span>
                    </button>
                  </div>
                </div>
                
                {habits.length === 0 ? (
                  <div className={`p-10 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-center`}>
                    <div className="text-5xl mb-4">🌱</div>
                    <h3 className="text-xl font-bold mb-2">No habits yet</h3>
                    <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Start building your habit tracker by adding your first habit.
                    </p>
                    <button
                      onClick={() => openModal('add-habit')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                      Add Your First Habit
                    </button>
                  </div>
                ) : filteredHabits.length === 0 ? (
                  <div className={`p-10 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-center`}>
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold mb-2">No matching habits</h3>
                    <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Try adjusting your search or filter criteria.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterCategory('all');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHabits.map(habit => (
                      <motion.div
                        key={habit.id}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`p-6 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-l-4 flex flex-col justify-between`}
                        style={{ borderLeftColor: habit.color }}
                      >
                        <div> {/* Content wrapper */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{habit.icon}</span>
                              <div>
                                <h3 className="text-lg font-bold">{habit.name}</h3>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Goal: {habit.goal} {habit.unit} daily
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1"> {/* Reduced gap */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click
                                  setNewHabit({
                                    name: habit.name,
                                    icon: habit.icon,
                                    goal: habit.goal,
                                    unit: habit.unit,
                                    category: habit.category,
                                    color: habit.color
                                  });
                                  setActiveHabit(habit); // Need active habit for edit context
                                  openModal('edit-habit');
                                }}
                                className={`p-1.5 rounded-md text-sm ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                                title="Edit Habit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click
                                  // Add confirmation dialog here in a real app
                                  handleDeleteHabit(habit.id);
                                }}
                                className={`p-1.5 rounded-md text-sm ${isDarkMode ? 'text-red-400 hover:text-red-300 hover:bg-gray-700' : 'text-red-500 hover:text-red-700 hover:bg-red-100'}`}
                                title="Delete Habit"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between mb-1 text-sm">
                              <span>Current streak</span>
                              <span className="font-medium">{habit.currentStreak} days 🔥</span>
                            </div>
                            <div className="flex justify-between mb-1 text-sm">
                              <span>Longest streak</span>
                              <span className="font-medium">{habit.longestStreak} days</span>
                            </div>
                            <div className="flex justify-between mb-1 text-sm">
                              <span>Weekly completion</span>
                              <span className="font-medium">{getWeeklyCompletionRate(habit)}%</span>
                            </div>
                          </div>
                        </div> {/* End Content wrapper */}

                        <div className="mt-auto"> {/* Push button to bottom */}
                          <button
                            onClick={() => handleHabitSelect(habit)}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 text-sm"
                          >
                            View Details & Log
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Analytics View */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="py-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Analytics & Insights</h2>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                Track your progress and identify patterns
              </p>
            </div>
            
            {habits.length === 0 ? (
              <div className={`p-10 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-center`}>
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-xl font-bold mb-2">No data to analyze</h3>
                <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Add some habits to see your analytics and insights.
                </p>
                <button
                  onClick={() => openModal('add-habit')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Add Your First Habit
                </button>
              </div>
            ) : (
              <>
                {/* Overall Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className={`p-6 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className="text-lg font-semibold mb-4">Overall Completion</h3>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${isDarkMode ? 'text-blue-300 bg-blue-900' : 'text-blue-600 bg-blue-200'}`}>
                            Progress
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-semibold inline-block ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                            {calculateOverallCompletionRate()}%
                          </span>
                        </div>
                      </div>
                      <div className={`overflow-hidden h-2 mb-4 text-xs flex rounded ${isDarkMode ? 'bg-gray-700' : 'bg-blue-200'}`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${calculateOverallCompletionRate()}%` }}
                          transition={{ duration: 1 }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                        ></motion.div>
                      </div>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {calculateOverallCompletionRate() >= 80
                        ? "Excellent! You're consistently completing your habits."
                        : calculateOverallCompletionRate() >= 50
                        ? "Good progress, but there's room for improvement."
                        : "Keep working on building consistency with your habits."}
                    </p>
                  </div>
                  
                  <div className={`p-6 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className="text-lg font-semibold mb-4">Most Consistent Habit</h3>
                    {habits.length > 0 && (
                      (() => {
                        const mostConsistentHabit = [...habits].sort((a, b) => 
                          getWeeklyCompletionRate(b) - getWeeklyCompletionRate(a)
                        )[0];
                        
                        return (
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{mostConsistentHabit.icon}</span>
                            <div>
                              <p className="font-medium">{mostConsistentHabit.name}</p>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {getWeeklyCompletionRate(mostConsistentHabit)}% completion rate
                              </p>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {mostConsistentHabit.currentStreak} day streak
                              </p>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                  
                  <div className={`p-6 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className="text-lg font-semibold mb-4">Needs Improvement</h3>
                    {habits.length > 0 && (
                      (() => {
                        const needsImprovement = [...habits].sort((a, b) => 
                          getWeeklyCompletionRate(a) - getWeeklyCompletionRate(b)
                        )[0];
                        
                        return (
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{needsImprovement.icon}</span>
                            <div>
                              <p className="font-medium">{needsImprovement.name}</p>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {getWeeklyCompletionRate(needsImprovement)}% completion rate
                              </p>
                              <button
                                onClick={() => handleHabitSelect(needsImprovement)}
                                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                              >
                                Log Progress
                              </button>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
                
                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className={`p-6 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold">Habits by Category</h3>
                    </div>
                    {renderCategoryPieChart()}
                  </div>
                  
                  <div className={`p-6 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold">Habit Trend</h3>
                      <select
                        value={activeHabit?.id || (habits.length > 0 ? habits[0].id : '')}
                        onChange={(e) => {
                          const habit = habits.find(h => h.id === e.target.value);
                          if (habit) setActiveHabit(habit);
                        }}
                        className={`px-2 py-1 rounded-md ${
                          isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'
                        } border focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm`}
                      >
                        {habits.map(habit => (
                          <option key={habit.id} value={habit.id}>{habit.name}</option>
                        ))}
                      </select>
                    </div>
                    {activeHabit ? (
                      renderTrendsChart(activeHabit)
                    ) : habits.length > 0 ? (
                      renderTrendsChart(habits[0])
                    ) : (
                      <div className="h-52 flex items-center justify-center">
                        <p>No data to display</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Insights Section */}
                <div className={`p-6 rounded-xl shadow-md mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className="text-xl font-bold mb-6">Insights & Recommendations</h3>
                  
                  <div className="space-y-6">
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-900 bg-opacity-20'}`}> {/* Subtle bg */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">💡</span>
                        <h4 className="font-medium">Consistency Analysis</h4>
                      </div>
                      {habits.length > 0 ? (
                        <p className="text-sm">
                          Your most consistent habit is <strong>{
                            [...habits].sort((a, b) => getWeeklyCompletionRate(b) - getWeeklyCompletionRate(a))[0].name
                          }</strong> with {
                            getWeeklyCompletionRate([...habits].sort((a, b) => 
                              getWeeklyCompletionRate(b) - getWeeklyCompletionRate(a)
                            )[0])
                          }% completion rate. Try to apply the same discipline to your other habits.
                        </p>
                      ) : <p className="text-sm">Add habits to see consistency analysis.</p>}
                    </div>
                    
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-900 bg-opacity-20'}`}> {/* Subtle bg */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🎯</span>
                        <h4 className="font-medium">Goal Setting</h4>
                      </div>
                      {habits.length > 0 ? (
                        <p className="text-sm">
                          {habits.some(h => getWeeklyCompletionRate(h) < 50)
                            ? `Consider adjusting your goals for ${
                                habits.filter(h => getWeeklyCompletionRate(h) < 50)[0].name
                              } to make them more achievable. Small wins build momentum.`
                            : `Your goals seem well-balanced. Consider increasing the challenge for habits you consistently complete.`
                          }
                        </p>
                      ) : <p className="text-sm">Add habits to get goal setting recommendations.</p>}
                    </div>
                    
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-purple-900 bg-opacity-20'}`}> {/* Subtle bg */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🏆</span>
                        <h4 className="font-medium">Streaks Champion</h4>
                      </div>
                      {habits.length > 0 ? (
                        <p className="text-sm">
                          Your longest streak overall is <strong>{user.longestStreak} days</strong>! The habit with the current longest individual streak is <strong>{
                            [...habits].sort((a, b) => b.currentStreak - a.currentStreak)[0].name
                          }</strong> ({[...habits].sort((a, b) => b.currentStreak - a.currentStreak)[0].currentStreak} days). Keep the momentum going!
                        </p>
                      ) : <p className="text-sm">Track your habits to build streaks.</p>}
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className={`py-4 px-6 text-center text-sm ${isDarkMode ? 'bg-gray-900 text-gray-500' : 'bg-gray-100 text-gray-600'}`}> {/* Footer contrast */}
        © {new Date().getFullYear()} HabitTracker. Built by Anshul Rastogi
      </footer>

      {/* Modals Container */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
            onClick={closeModal} // Close on overlay click
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`relative rounded-xl shadow-xl w-full max-w-lg p-6 ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-900'}`} /* Modal darker bg */
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              {/* Close Button */}
              <button 
                onClick={closeModal}
                className={`absolute top-3 right-3 p-1 rounded-full ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal Content */}
              {modalContent === 'add-habit' && (
                <div>
                  <h2 className="text-xl font-bold mb-6">Add New Habit</h2>
                  {/* Form for adding habit */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="habitName" className="block text-sm font-medium mb-1">Habit Name *</label>
                      <input 
                        type="text" 
                        id="habitName"
                        value={newHabit.name}
                        onChange={(e) => setNewHabit({...newHabit, name: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="e.g., Drink Water"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="habitIcon" className="block text-sm font-medium mb-1">Icon</label>
                        {/* Basic Icon Picker - could be improved with a dropdown/selector */}
                        <input 
                          type="text" 
                          id="habitIcon"
                          value={newHabit.icon}
                          onChange={(e) => setNewHabit({...newHabit, icon: e.target.value})}
                          className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          maxLength={2} // Limit to emoji length
                          placeholder="✅"
                        />
                      </div>
                      <div>
                        <label htmlFor="habitGoal" className="block text-sm font-medium mb-1">Daily Goal *</label>
                        <input 
                          type="number" 
                          id="habitGoal"
                          min="1"
                          value={newHabit.goal}
                          onChange={(e) => setNewHabit({...newHabit, goal: parseInt(e.target.value) || 1})}
                          className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="habitUnit" className="block text-sm font-medium mb-1">Unit *</label>
                      <input 
                        type="text" 
                        id="habitUnit"
                        value={newHabit.unit}
                        onChange={(e) => setNewHabit({...newHabit, unit: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="e.g., glasses, minutes, pages"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="habitCategory" className="block text-sm font-medium mb-1">Category</label>
                        <select
                          id="habitCategory"
                          value={newHabit.category}
                          onChange={(e) => setNewHabit({...newHabit, category: e.target.value as Habit['category']})}
                          className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="health">Health</option>
                          <option value="productivity">Productivity</option>
                          <option value="self-care">Self-Care</option>
                          <option value="fitness">Fitness</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="habitColor" className="block text-sm font-medium mb-1">Color</label>
                        <input 
                          type="color" 
                          id="habitColor"
                          value={newHabit.color}
                          onChange={(e) => setNewHabit({...newHabit, color: e.target.value})}
                          className={`w-full h-10 rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} cursor-pointer`}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button 
                      onClick={closeModal}
                      className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAddHabit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Habit
                    </button>
                  </div>
                </div>
              )}

              {modalContent === 'edit-habit' && activeHabit && (
                 <div>
                   <h2 className="text-xl font-bold mb-6">Edit Habit: {activeHabit.name}</h2>
                   {/* Form for editing habit, pre-filled */}
                   <div className="space-y-4">
                    <div>
                      <label htmlFor="editHabitName" className="block text-sm font-medium mb-1">Habit Name *</label>
                      <input 
                        type="text" 
                        id="editHabitName"
                        value={newHabit.name}
                        onChange={(e) => setNewHabit({...newHabit, name: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="e.g., Drink Water"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="editHabitIcon" className="block text-sm font-medium mb-1">Icon</label>
                        <input 
                          type="text" 
                          id="editHabitIcon"
                          value={newHabit.icon}
                          onChange={(e) => setNewHabit({...newHabit, icon: e.target.value})}
                          className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          maxLength={2}
                          placeholder="✅"
                        />
                      </div>
                      <div>
                        <label htmlFor="editHabitGoal" className="block text-sm font-medium mb-1">Daily Goal *</label>
                        <input 
                          type="number" 
                          id="editHabitGoal"
                          min="1"
                          value={newHabit.goal}
                          onChange={(e) => setNewHabit({...newHabit, goal: parseInt(e.target.value) || 1})}
                          className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="editHabitUnit" className="block text-sm font-medium mb-1">Unit *</label>
                      <input 
                        type="text" 
                        id="editHabitUnit"
                        value={newHabit.unit}
                        onChange={(e) => setNewHabit({...newHabit, unit: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="e.g., glasses, minutes, pages"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="editHabitCategory" className="block text-sm font-medium mb-1">Category</label>
                        <select
                          id="editHabitCategory"
                          value={newHabit.category}
                          onChange={(e) => setNewHabit({...newHabit, category: e.target.value as Habit['category']})}
                          className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="health">Health</option>
                          <option value="productivity">Productivity</option>
                          <option value="self-care">Self-Care</option>
                          <option value="fitness">Fitness</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="editHabitColor" className="block text-sm font-medium mb-1">Color</label>
                        <input 
                          type="color" 
                          id="editHabitColor"
                          value={newHabit.color}
                          onChange={(e) => setNewHabit({...newHabit, color: e.target.value})}
                          className={`w-full h-10 rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} cursor-pointer`}
                        />
                      </div>
                    </div>
                  </div>
                   <div className="mt-6 flex justify-end gap-3">
                     <button 
                       onClick={closeModal}
                       className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                     >
                       Cancel
                     </button>
                     <button 
                       onClick={handleEditHabit}
                       className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                     >
                       Save Changes
                     </button>
                   </div>
                 </div>
              )}

              {modalContent === 'settings' && (
                <div>
                  <h2 className="text-xl font-bold mb-6">Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <label htmlFor="darkModeToggle" className="font-medium">Dark Mode</label>
                      <button
                        id="darkModeToggle"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                      >
                        <span className="sr-only">Toggle Dark Mode</span>
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                       <label htmlFor="remindersToggle" className="font-medium">Show Reminders</label>
                       <button
                         id="remindersToggle"
                         onClick={() => setShowReminders(!showReminders)}
                         className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${showReminders ? 'bg-blue-600' : 'bg-gray-300'}`}
                      >
                         <span className="sr-only">Toggle Reminders</span>
                         <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${showReminders ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                     </div>
                     {/* Add more settings here */}
                     <p className="text-sm text-center text-gray-500 dark:text-gray-400 pt-4">More settings coming soon!</p>
                  </div>
                  <div className="mt-6 text-right">
                    <button 
                      onClick={closeModal}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
              
              {modalContent === 'profile' && (
                <div>
                  <h2 className="text-xl font-bold mb-6 text-center">My Profile</h2>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-blue-500 dark:border-blue-400 shadow-lg overflow-hidden bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-4xl font-semibold">
                       {user.avatar ? (
                         <Image
                           src={user.avatar}
                           alt="User Avatar"
                           width={96} // Required (size - border * 2)
                           height={96} // Required
                           className="object-cover"
                         />
                       ) : (
                         // Fallback initials
                         <span>{user.name.charAt(0)}</span>
                       )}
                    </div>
                     <h3 className="text-2xl font-semibold">{user.name}</h3>
                     <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                       Joined on {formatDate(user.joinDate)}
                     </p>

                     <div className="w-full pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4 text-center">
                       <div>
                         <p className="text-sm font-medium mb-1">Current Streak</p>
                         <p className="text-2xl font-bold">{user.currentStreak} days 🔥</p>
                       </div>
                       <div>
                         <p className="text-sm font-medium mb-1">Longest Streak</p>
                         <p className="text-2xl font-bold">{user.longestStreak} days 🏆</p>
                       </div>
                       <div className="col-span-2">
                         <p className="text-sm font-medium mb-1">Total Habits Completed</p>
                         <p className="text-2xl font-bold">{user.totalHabitsCompleted}</p>
                       </div>
                     </div>
                     
                     {/* Placeholder for profile actions */}
                     <p className="text-sm text-center text-gray-500 dark:text-gray-400 pt-4">Profile editing coming soon.</p>
                  </div>
                   <div className="mt-6 text-right">
                    <button 
                      onClick={closeModal}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div> // <-- This closes the main wrapper div
  ); // <-- This closes the return statement
} // <-- This closes the HabitTracker function component