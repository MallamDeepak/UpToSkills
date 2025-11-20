// src/components/MentorDashboard/components/SkillBadges/SkillBadgeForm.jsx

import React, { useState } from 'react';
import Header from '../Header';
import Sidebar from '../Sidebar';
import Footer from '../Footer'; // Added Footer from incoming changes

// Define the 6 fixed badge names with unique colors/styles
const FIXED_BADGES = [
    { name: 'Best Intern of the Week', icon: '🏆', color: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/50' },
    { name: 'Project Completion', icon: '✅', color: 'border-green-500 bg-green-50 dark:bg-green-950/50' },
    { name: 'Code Quality Award', icon: '💻', color: 'border-blue-500 bg-blue-50 dark:bg-blue-950/50' },
    { name: 'Teamwork Excellence', icon: '🤝', color: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50' },
    { name: 'Innovation Champion', icon: '💡', color: 'border-red-500 bg-red-50 dark:bg-red-950/50' },
    { name: 'Mentorship Star', icon: '🎓', color: 'border-purple-500 bg-purple-50 dark:bg-purple-950/50' },
];

// NOTE: Merged props to use the original prop name convention: setIsDarkMode
const SkillBadgeForm = ({ isDarkMode, setIsDarkMode }) => { 
    const [isOpen, setIsOpen] = useState(true);
    const [formData, setFormData] = useState({
        student_name: '',
        badge_name: '', // Will be set by clicking a card
        badge_description: '',
        verified: false,
    });
    // State to track submission status for UI feedback (from HEAD)
    const [submissionStatus, setSubmissionStatus] = useState(null);
    // State for student autocomplete
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const toggleSidebar = () => {
        setIsOpen((prev) => !prev);
    };

    // Fetch all students on component mount
    React.useEffect(() => {
        const fetchStudents = async () => {
            setLoadingStudents(true);
            try {
                const response = await fetch('http://localhost:5000/api/skill-badges/students');
                const data = await response.json();
                if (data.success) {
                    setStudents(data.data);
                }
            } catch (error) {
                console.error('Error fetching students:', error);
            } finally {
                setLoadingStudents(false);
            }
        };
        fetchStudents();
    }, []);

    // Close suggestions when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => setShowSuggestions(false);
        if (showSuggestions) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showSuggestions]);

    // Function to set the badge name when a card is clicked (from HEAD)
    const selectBadge = (badgeName) => {
        setFormData(prev => ({ 
            ...prev, 
            badge_name: badgeName,
        }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Handler specifically for student name input with autocomplete
    const handleStudentNameChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, student_name: value }));
        setIsTyping(true);
        
        if (value.trim().length > 0) {
            const filtered = students.filter(student => 
                student.full_name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredStudents(filtered);
            setShowSuggestions(true);
        } else {
            setFilteredStudents([]);
            setShowSuggestions(false);
        }
    };

    // Select a student from suggestions
    const selectStudent = (studentName, e) => {
        e.stopPropagation();
        setFormData(prev => ({ ...prev, student_name: studentName }));
        setFilteredStudents([]);
        setShowSuggestions(false);
        setIsTyping(false);
    };
    
    // Merged handleSubmit logic (using full error handling and token from HEAD)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmissionStatus('submitting');
        
        // 1. Get the Mentor/Admin token
        const token = localStorage.getItem('token'); 
        
        // Check if token exists
        if (!token) {
            setSubmissionStatus('error');
            alert('Authentication Error: Mentor token not found. Please log in again.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/skill-badges', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': token, // Send the token here!
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                setSubmissionStatus('success');
                alert('✅ Badge added successfully!');
                // Clear form data on successful submission
                setFormData({ student_name: '', badge_name: '', badge_description: '', verified: false });
            } else {
                setSubmissionStatus('error');
                console.error("Backend Error:", data.message || "Unknown error during badge creation.");
                // Show the detailed error message from backend
                alert(`❌ Failed to add badge\n\n${data.message || 'Unknown error. Check browser console for details.'}`);
            }
        } catch (error) {
            console.error('Network Error:', error);
            setSubmissionStatus('error');
            alert('A network error occurred. Check browser console.');
        }
    };

    // Find the currently selected badge for display (from HEAD)
    const selectedBadge = FIXED_BADGES.find(b => b.name === formData.badge_name);


    return (
        // Reverting to the simpler, non-conflicting container class
        <div className={`flex min-h-screen transition-all duration-300 ${isDarkMode ? "dark bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
            
            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} isDarkMode={isDarkMode} />
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'ml-0'}`}>
                
                <Header 
                    onMenuClick={toggleSidebar} 
                    isDarkMode={isDarkMode} 
                    toggleDarkMode={() => setIsDarkMode(prev => !prev)} 
                />

                <main className="min-h-screen flex items-center justify-center px-4 py-10 pt-24">
                    <div className="p-6 bg-white rounded-lg w-full max-w-2xl shadow-md dark:bg-gray-800">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">Award a Skill Badge</h2>
                        
                        {/* 1. BADGE SELECTION GALLERY (From HEAD) */}
                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-3 dark:text-white">1. Select Badge Type:</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {FIXED_BADGES.map((badge) => (
                                    <div
                                        key={badge.name}
                                        onClick={() => selectBadge(badge.name)}
                                        className={`p-3 text-center rounded-lg border-2 cursor-pointer transition-all duration-200 
                                            ${badge.color}
                                            ${formData.badge_name === badge.name 
                                                ? 'border-4 ring-2 ring-offset-2 ring-blue-500' 
                                                : 'border-transparent hover:border-blue-400'
                                            }`}
                                    >
                                        <div className1="text-3xl mb-1">{badge.icon}</div>
                                        <p className="text-sm font-semibold dark:text-gray-100">{badge.name}</p>
                                    </div>
                                ))}
                            </div>
                            {formData.badge_name && (
                                <p className="mt-3 text-md text-blue-600 dark:text-blue-400">
                                    **Badge Selected:** {selectedBadge?.icon} {selectedBadge?.name}
                                </p>
                            )}
                        </div>
                        
                        {/* 2. AWARD DETAILS FORM (From HEAD, conditionally rendered after selection) */}
                        {formData.badge_name && (
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                
                                <h3 className="text-lg font-medium pt-4 mb-3 border-t dark:border-gray-600 dark:text-white">2. Award Details:</h3>
                                
                                {/* Student Name Input with Autocomplete */}
                                <label className="block dark:text-white">
                                    Student Name: 
                                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            placeholder="Start typing student name..."
                                            name="student_name"
                                            value={formData.student_name}
                                            onChange={handleStudentNameChange}
                                            onFocus={() => formData.student_name && setShowSuggestions(true)}
                                            onClick={() => formData.student_name && setShowSuggestions(true)}
                                            required
                                            autoComplete="off"
                                            className="w-full mt-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                        
                                        {/* Autocomplete Dropdown */}
                                        {showSuggestions && filteredStudents.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                {filteredStudents.map((student) => (
                                                    <div
                                                        key={student.id}
                                                        onClick={(e) => selectStudent(student.full_name, e)}
                                                        className="p-2 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer border-b dark:border-gray-600 last:border-b-0"
                                                    >
                                                        <div className="font-medium text-gray-900 dark:text-white">{student.full_name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Show when no students match */}
                                        {showSuggestions && isTyping && formData.student_name && filteredStudents.length === 0 && students.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-3">
                                                <p className="text-sm text-red-600 dark:text-red-400">⚠️ No students found with that name</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Make sure the student is registered in the system</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Student count indicator */}
                                    {!loadingStudents && students.length > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            💡 {students.length} student(s) registered. Start typing to search.
                                        </p>
                                    )}
                                </label>

                                {/* Badge Description Textarea */}
                                <label className="block dark:text-white">
                                    Badge Description <span className="text-red-500">*</span>
                                    <textarea
                                        name="badge_description"
                                        placeholder="Brief reason for the award (e.g., Completed the MERN stack project with high code quality)"
                                        value={formData.badge_description}
                                        onChange={handleChange}
                                        required
                                        className="w-full mt-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    ></textarea>
                                </label>

                                {/* Verified Checkbox */}
                                <label className="inline-flex items-center space-x-2 dark:text-white">
                                    <input
                                        type="checkbox"
                                        name="verified"
                                        checked={formData.verified}
                                        onChange={handleChange}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-600 dark:border-gray-500"
                                    />
                                    <span>Verified Badge</span>
                                </label>

                                {/* Submit Button and Status Messages */}
                                <button
                                    type="submit"
                                    disabled={submissionStatus === 'submitting'}
                                    className={`px-4 py-2 text-white rounded-md transition ${
                                        submissionStatus === 'submitting'
                                            ? 'bg-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    {submissionStatus === 'submitting' ? 'Submitting...' : 'Award Badge'}
                                </button>
                                
                                {/* Submission Status Messages */}
                                {submissionStatus === 'success' && (
                                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                        Skill badge added successfully! 🎉
                                    </p>
                                )}
                                {submissionStatus === 'error' && (
                                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                        Error adding badge. Check console for details.
                                    </p>
                                )}
                            </form>
                        )}
                    </div>
                </main>
                <Footer isDarkMode={isDarkMode} />
            </div>
        </div>
    );
};

export default SkillBadgeForm;