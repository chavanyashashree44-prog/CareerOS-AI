import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./components/dashboard/Dashboard";
import Profile from "./components/profile/Profile";

import Signup from "./components/auth/Signup";
import Login from "./components/auth/Login";

import Learning from "./components/learning/Learning";
import TopicDetail from "./components/learning/TopicDetail";
import Practice from "./components/learning/Practice";
import Assessment from "./components/learning/Assessment";

import Resume from "./components/resume/Resume";
import ResumeBuilder from "./components/resume/ResumeBuilder";

import SkillDevelopment from "./components/skills/SkillDevelopment";
import Opportunities from "./components/opportunities/Opportunities";
import Applications from "./components/applications/Applications";
import InterviewStudio from "./components/interview/InterviewStudio";


function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* DASHBOARD */}
                <Route
                    path="/"
                    element={<Dashboard />}
                />

                {/* PROFILE */}
                <Route
                    path="/profile"
                    element={<Profile />}
                />

                {/* AUTHENTICATION */}
                <Route
                    path="/signup"
                    element={<Signup />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* AI RESUME */}
                <Route
                    path="/resume"
                    element={<Resume />}
                />

                <Route
                    path="/resume/create"
                    element={<ResumeBuilder />}
                />

                {/* LEARNING HOME */}
                <Route
                    path="/learning"
                    element={<Learning />}
                />

                {/* ASSESSMENT */}
                <Route
                    path="/learning/topic/:topicId/assessment"
                    element={<Assessment />}
                />

                {/* PRACTICE */}
                <Route
                    path="/learning/topic/:topicId/practice"
                    element={<Practice />}
                />

                {/* TOPIC DETAIL */}
                <Route
                    path="/learning/topic/:topicId"
                    element={<TopicDetail />}
                />

                {/* SKILL DEVELOPMENT */}
                <Route
                    path="/skills"
                    element={<SkillDevelopment />}
                />

                <Route 
                path="/opportunities" 
                element={<Opportunities />} 
                />

            {/* APPLICATION TRACKING */}
                <Route
                path="/applications"
                element={<Applications />}
                />

                <Route path="/interview" 
                element={<InterviewStudio />} 
                />
                
                </Routes>
        </BrowserRouter>
    );
}

export default App;