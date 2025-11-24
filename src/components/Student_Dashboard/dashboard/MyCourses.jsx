import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const MyCourses = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.log("No token found in localStorage");
        setError("Please login to view your courses");
        setLoading(false);
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      console.log("Fetching student details...");
      // Get student details first
      const studentRes = await axios.get("http://localhost:5000/api/auth/getStudent", {
        headers: { Authorization: token }
      });

      console.log("Student data:", studentRes.data);
      const studentId = studentRes.data.id;

      if (!studentId) {
        throw new Error("Student ID not found");
      }

      console.log("Fetching enrollments for student ID:", studentId);
      // Fetch enrolled courses
      const enrollmentRes = await axios.get(
        `http://localhost:5000/api/enrollments/student/${studentId}`
      );

      console.log("Enrollment response:", enrollmentRes.data);
      setCourses(enrollmentRes.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching courses:", err);
      
      // Provide more specific error messages
      if (err.response) {
        // Server responded with error
        if (err.response.status === 401) {
          setError("Session expired. Please login again.");
          setTimeout(() => {
            localStorage.removeItem("token");
            navigate("/login");
          }, 2000);
        } else if (err.response.status === 404) {
          setError("Student not found. Please contact support.");
        } else if (err.response.status === 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(`Error: ${err.response.data?.message || "Failed to load courses"}`);
        }
      } else if (err.request) {
        // Request was made but no response
        setError("Cannot connect to server. Please check if the backend is running.");
      } else {
        // Something else happened
        setError(err.message || "Failed to load courses");
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white">
      
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      
      <div className="flex flex-col flex-1 lg:ml-64 transition-all duration-300">

        <Header />
        <main className="flex-1 p-8 mt-24"> 
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">My Courses</h1>
            <div className="flex gap-4">
              <button 
                onClick={() => navigate("/programs")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Browse Courses
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">No Courses Enrolled</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You haven't enrolled in any courses yet. Browse our programs to get started!
              </p>
              <button 
                onClick={() => navigate("/programs")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Browse Programs
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((enrollment) => (
                <div 
                  key={enrollment.id} 
                  className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 hover:shadow-lg transition"
                >
                  <h2 className="text-xl font-semibold mb-2">{enrollment.course_name}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {enrollment.description || "No description available"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      enrollment.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {enrollment.status}
                    </span>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      Continue
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>
        <footer className="bg-gray-900 text-gray-300 border-t border-gray-700 py-4 text-center">
          <p className="text-sm">© 2025 UpToSkills. Built by learners.</p>
        </footer>
      </div>
    </div>
  );
};

export default MyCourses;
