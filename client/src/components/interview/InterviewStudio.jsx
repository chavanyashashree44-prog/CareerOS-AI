import { useEffect, useRef, useState } from "react";
import {
    Camera,
    Mic,
    Brain,
    Play,
    Send,
    RotateCcw,
    Square,
    Circle,
    Volume2,
} from "lucide-react";
import { supabase } from "../../config/supabase";
import "./InterviewStudio.css";

import {
    FaceDetector,
    FilesetResolver,
} from "@mediapipe/tasks-vision";


function InterviewStudio() {
    const [faceFeedback, setFaceFeedback] = useState(
    "Turn on your camera to begin face detection."
    );
    const [speakingFeedback, setSpeakingFeedback] = useState("");
    const [speakingPace, setSpeakingPace] = useState(null);
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [answer, setAnswer] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const [interviewMode, setInterviewMode] = useState("HR");
    const [selectedRole, setSelectedRole] = useState("Full-Stack Developer");
    const [difficulty, setDifficulty] = useState("Beginner");
    const [questionIndex, setQuestionIndex] = useState(0);
    const [sessionQuestions, setSessionQuestions] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [sessionError, setSessionError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evaluation, setEvaluation] = useState(null);
    const [evaluationError, setEvaluationError] = useState("");
    const [isEvaluating, setIsEvaluating] = useState(false);

    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState("");

    const [microphoneActive, setMicrophoneActive] = useState(false);
    const [microphoneError, setMicrophoneError] = useState("");

    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const recordingStartTimeRef = useRef(null);
    const [recordingError, setRecordingError] = useState("");

    const [recordedAudioUrl, setRecordedAudioUrl] = useState("");
    const [recordedAudio, setRecordedAudio] = useState(null);
    const [recordingSize, setRecordingSize] = useState(0);

    const [selectedMicrophone, setSelectedMicrophone] = useState("");

    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [transcriptionError, setTranscriptionError] = useState("");

    const videoRef = useRef(null);
    const audioRef = useRef(null);

    const cameraStreamRef = useRef(null);
    const faceDetectorRef = useRef(null);
    const microphoneStreamRef = useRef(null);
    const recordingStreamRef = useRef(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const recordingTimerRef = useRef(null);

    


const questionBank = {
    HR: {
        Beginner: [
            "Tell me about yourself and your background in Computer Science.",
            "What are your strengths and weaknesses?",
            "Why should we hire you?",
            "Why did you choose Computer Science as your field?",
            "What are your short-term career goals?",
            "What motivates you to learn new skills?",
            "How do you manage your time during college projects?",
            "What do you know about our company?",
            "What makes you a good team member?",
            "How do you respond to constructive feedback?",
        ],
        Intermediate: [
            "Describe a challenge you faced and how you overcame it.",
            "How do you handle disagreements in a team?",
            "Where do you see yourself in five years?",
            "Tell me about a time you worked under a tight deadline.",
            "Describe a situation where you took initiative.",
            "How do you prioritize multiple tasks?",
            "Tell me about a time you received difficult feedback.",
            "How would you handle a teammate who misses deadlines?",
            "Describe a time you had to learn something quickly.",
            "What would you do if you disagreed with your team leader?",
        ],
        Advanced: [
            "Describe a professional failure and what you learned.",
            "How would you handle a conflict with your manager?",
            "Tell me about a difficult decision you made.",
            "Describe a time you influenced a decision without authority.",
            "How would you manage competing priorities from multiple stakeholders?",
            "Tell me about a time you challenged an established process.",
            "How would you respond if your ethical values conflicted with a business request?",
            "Describe a situation where you had to lead through uncertainty.",
            "How would you handle persistent underperformance within your team?",
            "What would you do if a project decision you supported caused a setback?",
        ],
    },

    Technical: {
        Beginner: [
            "What is the difference between a stack and a queue?",
            "What is the difference between an array and a linked list?",
            "What is the difference between == and === in JavaScript?",
            "What are the main principles of object-oriented programming?",
            "What is the difference between a compiler and an interpreter?",
            "What is a primary key in a database?",
            "What is the difference between GET and POST requests?",
            "What is the purpose of an operating system?",
            "What is the difference between frontend and backend development?",
            "What is a function in programming?",
            "What is recursion, and when would you use it?",
            "What is the difference between local and global variables?",
            "What is an API?",
            "What is version control, and why is Git useful?",
            "What is the difference between syntax errors and logical errors?",
        ],
        Intermediate: [
            "Explain the difference between processes and threads.",
            "What is the difference between SQL and NoSQL databases?",
            "How does a hash table work, and how are collisions handled?",
            "Explain the time complexity of binary search.",
            "What is normalization in relational databases?",
            "Explain the difference between authentication and authorization.",
            "What happens when you enter a URL into a browser?",
            "How do promises and async/await work in JavaScript?",
            "What is a race condition, and how can it be prevented?",
            "Explain the difference between REST and GraphQL.",
            "What is indexing in a database, and what are its trade-offs?",
            "How does garbage collection work?",
            "What is the difference between TCP and UDP?",
            "Explain the purpose of a load balancer.",
            "How would you debug a memory leak in an application?",
        ],
        Advanced: [
            "How would you design a scalable backend for a web application?",
            "Explain how you would optimize a slow database query.",
            "How would you design a system to handle millions of requests?",
            "How would you design a distributed caching strategy?",
            "Explain consistency, availability, and partition tolerance in distributed systems.",
            "How would you prevent duplicate processing in a distributed application?",
            "How would you investigate high latency across multiple services?",
            "How would you design rate limiting for a public API?",
            "How would you migrate a large database with minimal downtime?",
            "How would you design a reliable message-processing pipeline?",
            "How would you identify and resolve a production memory bottleneck?",
            "How would you secure communication between microservices?",
            "How would you handle database sharding and data rebalancing?",
            "How would you design observability for a distributed application?",
            "How would you plan disaster recovery for a critical web service?",
        ],
    },

    "Project-Based": {
        Beginner: [
            "Explain a project you have built and your role in it.",
            "Which technologies did you use in your project?",
            "What did you learn while building your project?",
            "What problem does your project solve?",
            "Who are the intended users of your project?",
            "How did you choose your project's technology stack?",
            "What are the main features of your project?",
            "How is your project organized into modules?",
            "What difficulties did you encounter while setting up your project?",
            "How would you demonstrate your project to a new user?",
        ],
        Intermediate: [
            "Describe the biggest technical challenge in your project.",
            "How did you test and debug your project?",
            "How does your frontend communicate with your backend?",
            "How did you design your database schema?",
            "How do you validate user input in your application?",
            "How did you handle errors and unexpected inputs?",
            "How did you manage configuration and environment variables?",
            "How did you test the main features of your project?",
            "What would you improve about your current architecture?",
            "How did you deploy your project, and what deployment issues did you face?",
        ],
        Advanced: [
            "How would you redesign your project to support ten times more users?",
            "How would you improve your project's security and reliability?",
            "How would you reduce latency and improve scalability?",
            "How would you investigate a production failure in your project?",
            "How would you protect sensitive user data stored by your application?",
            "How would you design automated testing and deployment for your project?",
            "How would you measure whether your project's main features are effective?",
            "How would you recover your project after a database failure?",
            "How would you identify and remove architectural bottlenecks?",
            "If you rebuilt your project from scratch, what design decisions would you change and why?",
        ],
    },
};


const roleQuestionBank = {
    "AI Full-Stack Developer": {
        HR: {
            Beginner: [
                "Tell me about yourself and why you want to become an AI Full-Stack Developer.",
                "Why are you interested in building applications that use AI?",
                "What are your strongest technical skills?",
                "How do you approach learning a new technology?",
                "How do you handle a challenging programming task?",
                "Describe a project you have worked on.",
                "How do you manage your time when working on a project?",
                "What motivates you to work in software development?",
                "How do you respond to feedback on your code?",
                "What are your career goals as an AI Full-Stack Developer?"
            ],
            Intermediate: [
                "Describe a project where you connected a frontend, backend, and AI service.",
                "How do you prioritize features when building an AI-powered application?",
                "Tell me about a difficult technical problem you solved.",
                "How do you balance development speed with code quality?",
                "How would you explain an AI feature to a non-technical stakeholder?",
                "Describe a time you had to learn a tool quickly to complete a project.",
                "How do you handle disagreements about technical decisions?",
                "How do you respond when an AI feature performs worse than expected?",
                "How do you keep your full-stack development skills up to date?",
                "What makes you a strong candidate for an AI-focused development role?"
            ],
            Advanced: [
                "How would you lead the development of a production-ready AI application?",
                "Describe how you would handle a major outage affecting an AI-powered product.",
                "How would you communicate AI limitations and risks to product leadership?",
                "How do you decide whether an AI feature is worth its development and maintenance cost?",
                "Tell me about a time you made a difficult architectural trade-off.",
                "How would you mentor a developer who is new to full-stack AI development?",
                "How would you handle conflicting requirements from product and engineering teams?",
                "How would you build user trust in an AI-powered application?",
                "How would you measure the business impact of an AI feature?",
                "What would your priorities be during your first 90 days in this role?"
            ]
        },
        Technical: {
            Beginner: [
                "What is the difference between frontend and backend development?",
                "What are HTML, CSS, and JavaScript used for?",
                "What is a REST API?",
                "What is JSON, and why is it commonly used in APIs?",
                "What is the purpose of a database in a web application?",
                "What is the difference between authentication and authorization?",
                "What is an AI model, and how does an application use one?",
                "What is an API key, and why should it be kept secret?",
                "What is the difference between synchronous and asynchronous code?",
                "How does a browser communicate with a backend server?"
            ],
            Intermediate: [
                "How would you integrate an LLM API into a full-stack web application?",
                "How would you stream AI-generated responses to a frontend?",
                "How would you protect an AI API endpoint from abuse?",
                "How would you store and retrieve conversation history for each user?",
                "How would you validate user input before sending it to an AI model?",
                "What is retrieval-augmented generation, and when would you use it?",
                "How would you handle timeouts and rate limits from an AI provider?",
                "How would you reduce the latency of an AI-powered application?",
                "How would you test an API that returns nondeterministic AI responses?",
                "How would you manage secrets and environment variables across deployments?"
            ],
            Advanced: [
                "Design a scalable architecture for a multi-user AI application with streaming responses.",
                "How would you implement tenant isolation for user data and AI conversation history?",
                "How would you evaluate an LLM for accuracy, latency, cost, and safety?",
                "How would you design caching for AI requests without exposing private user data?",
                "How would you defend an AI application against prompt injection?",
                "How would you implement observability across the frontend, backend, database, and LLM provider?",
                "How would you handle model-provider failure with retries and fallback models?",
                "How would you design a secure RAG pipeline with document-level access control?",
                "How would you optimize token usage while maintaining response quality?",
                "How would you version, test, and roll back changes to prompts and AI models?"
            ]
        },
        "Project-Based": {
            Beginner: [
                "Explain how you would build a simple chatbot with a web interface.",
                "How would you connect a frontend form to a backend API?",
                "How would you display an AI response on a webpage?",
                "How would you store basic user information in a database?",
                "How would you show a loading indicator while an AI response is generated?",
                "How would you handle an error when an AI API request fails?",
                "How would you keep an AI API key out of frontend code?",
                "How would you test the main features of a simple AI web application?",
                "How would you deploy a basic frontend and backend application?",
                "What features would you include in a first version of an AI assistant?"
            ],
            Intermediate: [
                "Design an AI resume analyzer with a frontend, backend, and LLM integration.",
                "How would you build a chatbot that answers questions from uploaded documents?",
                "How would you save and display each user's previous AI conversations?",
                "How would you implement login and protect private application routes?",
                "How would you build an AI interview practice tool that evaluates answers?",
                "How would you process a document before indexing it for RAG?",
                "How would you design a dashboard that displays AI usage and response metrics?",
                "How would you handle large file uploads in an AI application?",
                "How would you test an AI feature whose answers can vary between runs?",
                "How would you deploy and troubleshoot a full-stack AI project?"
            ],
            Advanced: [
                "Design a production architecture for a multi-tenant RAG application with document permissions.",
                "How would you scale an AI interview platform for thousands of concurrent users?",
                "How would you prevent one user's uploaded documents from appearing in another user's answers?",
                "How would you design an evaluation pipeline for detecting regressions in AI response quality?",
                "How would you control AI inference costs while meeting latency targets?",
                "How would you secure file ingestion against malicious or malformed documents?",
                "How would you introduce background jobs for long-running AI workflows?",
                "How would you monitor and recover from failures across a distributed AI application?",
                "How would you design a safe fallback when an AI provider becomes unavailable?",
                "How would you plan a migration to a new LLM without disrupting existing users?"
            ]
        }
    },


        
    "Frontend Developer": {
        HR: {
            Beginner: [
                "Tell me about yourself and why you want to become a Frontend Developer.",
                "Why do you enjoy building user interfaces?",
                "What frontend technologies have you learned?",
                "What motivates you to improve a website's user experience?",
                "How do you approach learning a new frontend framework?",
                "Describe a website or interface you have built.",
                "How do you respond to feedback about your UI design?",
                "How do you manage your time when developing a webpage?",
                "What are your strengths as a frontend developer?",
                "What are your career goals in frontend development?"
            ],
            Intermediate: [
                "Describe a frontend project where you solved a difficult UI problem.",
                "How do you balance visual design, accessibility, and performance?",
                "How do you handle changing requirements during frontend development?",
                "Describe a time you debugged a difficult browser issue.",
                "How do you collaborate with designers and backend developers?",
                "How do you prioritize frontend bugs and feature requests?",
                "How do you keep your frontend skills up to date?",
                "How do you handle feedback when a design implementation needs major changes?",
                "How do you make technical trade-offs under a deadline?",
                "What makes a frontend experience feel polished and reliable?"
            ],
            Advanced: [
                "How would you lead a frontend team through a major redesign?",
                "How would you resolve disagreements between design and engineering?",
                "How would you set frontend quality standards across a large team?",
                "How would you handle a critical accessibility issue close to release?",
                "How would you evaluate whether a frontend architecture needs to change?",
                "How would you mentor junior frontend developers?",
                "How would you prioritize performance improvements against new features?",
                "How would you respond to a production incident caused by a frontend release?",
                "How would you measure the success of a frontend redesign?",
                "What would your priorities be in your first 90 days as a senior Frontend Developer?"
            ]
        },
        Technical: {
            Beginner: [
                "What is the difference between HTML, CSS, and JavaScript?",
                "What is semantic HTML, and why is it important?",
                "What is the CSS box model?",
                "What is the difference between class and id selectors in CSS?",
                "What is the difference between == and === in JavaScript?",
                "What is the DOM, and how can JavaScript interact with it?",
                "What is responsive web design?",
                "What is the difference between let, const, and var?",
                "What are React components and props?",
                "What is the purpose of event listeners in JavaScript?"
            ],
            Intermediate: [
                "What is the difference between controlled and uncontrolled components in React?",
                "How do useState and useEffect work in React?",
                "How does the browser's rendering process work?",
                "How would you identify and fix unnecessary React re-renders?",
                "What is event delegation, and when is it useful?",
                "How do promises and async/await help manage asynchronous JavaScript?",
                "How would you improve a webpage's Core Web Vitals?",
                "What is the difference between CSS Flexbox and CSS Grid?",
                "How would you implement accessible keyboard navigation?",
                "How do you manage API loading, success, and error states in a React interface?"
            ],
            Advanced: [
                "Explain how the JavaScript event loop handles tasks and microtasks.",
                "How would you profile and optimize a React application with slow rendering?",
                "How would you design a scalable component library for multiple teams?",
                "How do server-side rendering and client-side rendering differ?",
                "How would you prevent cross-site scripting in a frontend application?",
                "How would you implement code splitting and lazy loading in a large React app?",
                "How would you manage state across a complex frontend application?",
                "How would you investigate layout shifts and rendering performance issues?",
                "How would you design a frontend authentication flow with secure session handling?",
                "How would you test a complex frontend application at unit, integration, and end-to-end levels?"
            ]
        },
    
        "Project-Based": {
            Beginner: [
                "How would you build a responsive personal portfolio website?",
                "How would you create a navigation bar that works on mobile and desktop?",
                "How would you validate a form using HTML and JavaScript?",
                "How would you build a reusable button component in React?",
                "How would you fetch data from an API and display it on a webpage?",
                "How would you show loading and error messages while fetching data?",
                "How would you create a responsive card layout using CSS?",
                "How would you implement search that filters a list of items?",
                "How would you make a webpage accessible to keyboard users?",
                "How would you deploy a basic React application?"
            ],
            Intermediate: [
                "How would you build a React dashboard that consumes a REST API?",
                "How would you implement pagination and filtering for a large data table?",
                "How would you create a reusable form system with validation?",
                "How would you protect frontend routes that require authentication?",
                "How would you build a theme switcher with persistent preferences?",
                "How would you optimize a product listing page with many images?",
                "How would you implement search with debouncing?",
                "How would you organize components and features in a growing React project?",
                "How would you test a multi-step form and its validation rules?",
                "How would you troubleshoot a layout that breaks only on mobile devices?"
            ],
            Advanced: [
                "Design a scalable frontend architecture for a multi-tenant SaaS dashboard.",
                "How would you migrate a large legacy frontend to React incrementally?",
                "How would you build a design system shared by several applications?",
                "How would you implement resilient data fetching with caching and stale data handling?",
                "How would you improve the performance of a page with thousands of interactive items?",
                "How would you design an accessible, reusable data table with sorting and virtualization?",
                "How would you deploy frontend releases safely with feature flags and rollback support?",
                "How would you investigate a production memory leak in a single-page application?",
                "How would you implement internationalization and right-to-left layouts in a React app?",
                "How would you establish automated visual regression testing for a large component library?"
                ]
        }
    
},

    "AI Software Developer": {
        HR: {
            Beginner: [
                "Tell me about yourself and why you want to become an AI Software Developer.",
                "What interests you about combining AI with software development?",
                "How do you learn a new programming tool?"
            ],
            Intermediate: [
                "Describe a software project where you would integrate an AI model.",
                "How do you balance software quality with AI feature development?",
                "How do you explain an AI system's limitations to a client?"
            ],
            Advanced: [
                "How would you lead the development of a reliable AI software product?",
                "How would you manage a production issue caused by incorrect AI output?",
                "How would you evaluate the business value of an AI feature?"
            ]
        },
        Technical: {
            Beginner: [
                "What is artificial intelligence, and how can software use it?",
                "What is the difference between AI, machine learning, and deep learning?",
                "What is an API, and how can it connect software to an AI model?"
            ],
            Intermediate: [
                "How would you integrate an AI model into a REST API?",
                "How would you validate and handle AI model responses?",
                "How would you test software that uses nondeterministic AI output?"
            ],
            Advanced: [
                "How would you design a scalable AI inference service?",
                "How would you monitor model quality and software reliability in production?",
                "How would you implement secure model access, logging, and fallback handling?"
            ]
        },
        "Project-Based": {
            Beginner: [
                "How would you build a simple application that predicts a result using a trained model?",
                "How would you connect a web form to an AI prediction endpoint?",
                "How would you display prediction results and errors to a user?"
            ],
            Intermediate: [
                "Design an AI-powered application with authentication and prediction history.",
                "How would you package and deploy a trained model behind an API?",
                "How would you test the complete workflow from user input to model output?"
            ],
            
            Advanced: [
                "Design a production architecture for an AI application serving many users.",
                "How would you deploy model updates without interrupting users?",
                "How would you investigate a drop in model accuracy after deployment?"
            ]
        }
    },


    "AI Application Developer": {
        HR: {
            Beginner: [
                "Tell me about yourself and your interest in AI application development.",
                "What types of everyday problems could AI applications solve?",
                "Which programming skills would you bring to this role?"
            ],
            Intermediate: [
                "Describe how you would turn a user problem into an AI-powered feature.",
                "How would you respond to user feedback about inaccurate AI results?",
                "How do you prioritize usability, accuracy, and development time?"
            ],
            Advanced: [
                "How would you define the roadmap for an AI application?",
                "How would you handle privacy concerns in an AI product?",
                "How would you measure whether users benefit from an AI feature?"
            ]
        },
        Technical: {
            Beginner: [
                "What is an AI application?",
                "What is the difference between a rule-based application and an AI-powered application?",
                "Why should API keys be stored on the backend?"
            ],
            Intermediate: [
                "How would you integrate an LLM API into a web application?",
                "How would you validate user input before sending it to an AI service?",
                "How would you handle API timeouts, rate limits, and failed responses?"
            ],
            Advanced: [
                "How would you design an AI application with modular model-provider integration?",
                "How would you defend an AI application against prompt injection?",
                "How would you evaluate response quality, latency, cost, and safety?"
            ]
        },
        "Project-Based": {
            Beginner: [
                "How would you build a simple AI chatbot interface?",
                "How would you show loading, success, and error states for an AI request?",
                "How would you store a user's application preferences?"
            ],
            Intermediate: [
                "Design a document-question-answering application using an LLM.",
                "How would you add user accounts and private conversation history?",
                "How would you test an AI feature using different input examples?"
            ],
            
            Advanced: [
                "Design a multi-user AI application with secure document access.",
                "How would you reduce AI inference costs without greatly reducing quality?",
                "How would you evaluate an AI application before a production release?"
            ]
        }
    },


    "AI/ML Engineer": {
        HR: {
            Beginner: [
                "Tell me about yourself and why you are interested in AI/ML engineering.",
                "Which machine learning topics have you studied?",
                "Describe a machine learning project you would like to build."
            ],
            Intermediate: [
                "Describe a machine learning problem you have worked on or studied.",
                "How would you investigate a model that performs poorly?",
                "How do you keep your machine learning knowledge up to date?"
            ],
            Advanced: [
                "How would you decide whether a machine learning solution is suitable for a business problem?",
                "How would you communicate model limitations to non-technical stakeholders?",
                "How would you balance model accuracy, inference speed, and operating cost?"
            ]
        },
        Technical: {
            Beginner: [
                "What is the difference between supervised and unsupervised learning?",
                "What are training data and testing data?",
                "What is overfitting in machine learning?"
            ],
            Intermediate: [
                "What is the bias-variance trade-off?",
                "How do precision, recall, F1-score, and ROC-AUC differ?",
                "How would you handle missing values and imbalanced classes?"
            ],
            Advanced: [
                "How would you detect data drift and model performance degradation?",
                "How would you design a reproducible machine learning training pipeline?",
                "How would you compare model candidates while avoiding data leakage?"
            ]
        },
        "Project-Based": {
            Beginner: [
                "How would you build a basic classification model using Python?",
                "How would you split a dataset for training and evaluation?",
                "How would you present model predictions to a user?"
            ],
            Intermediate: [
                "Design an end-to-end customer churn prediction pipeline.",
                "How would you tune a model and compare it against a baseline?",
                "How would you expose a trained model through a backend API?"
            ],
            Advanced: [
                "Design a production ML pipeline covering data validation, training, and deployment.",
                "How would you roll back a model after detecting a performance regression?",
                "How would you monitor data drift and retrain a model safely?"
            ]
        }
    },

    
    "Backend Developer": {
        HR: {
            Beginner: [
                "Tell me about yourself and why you want to become a Backend Developer.",
                "What interests you about server-side development?",
                "Which programming languages have you used for backend development?",
                "What do you understand by a client-server architecture?",
                "Why is problem-solving important for a Backend Developer?",
                "Describe a programming project you have worked on.",
                "How do you approach learning a new backend technology?",
                "How do you handle errors while writing code?",
                "How do you manage your time when working on a project?",
                "What are your career goals as a Backend Developer?"
            ],
            Intermediate: [
                "Describe a backend project where you designed or implemented an API.",
                "How do you prioritize performance, security, and maintainability?",
                "Tell me about a difficult backend bug you would investigate.",
                "How do you handle changing requirements during development?",
                "How do you collaborate with frontend developers?",
                "Describe how you would respond to a production API failure.",
                "How do you ensure your code is readable and maintainable?",
                "How do you approach learning an unfamiliar framework?",
                "How do you handle disagreements about backend architecture?",
                "What makes a backend service reliable?"
            ],
            Advanced: [
                "How would you lead the design of a production-grade backend system?",
                "How would you respond to a major production outage?",
                "How would you prioritize technical debt against new features?",
                "How would you mentor junior backend developers?",
                "How would you handle conflicting scalability and delivery requirements?",
                "How would you establish code review and testing standards?",
                "How would you communicate a complex architectural decision to stakeholders?",
                "How would you evaluate whether a service should be split into microservices?",
                "How would you improve reliability across a distributed backend?",
                "What would your priorities be in your first 90 days as a senior Backend Developer?"
            ]
        },
        Technical: {
            Beginner: [
                "What is backend development?",
                "What is the difference between frontend and backend development?",
                "What is an API?",
                "What is a REST API?",
                "What is the difference between HTTP and HTTPS?",
                "What is JSON, and why is it used in APIs?",
                "What is a database, and why does a backend need one?",
                "What is the difference between authentication and authorization?",
                "What are HTTP status codes? Give a few examples.",
                "What is the purpose of environment variables in a backend application?"
            ],
            Intermediate: [
                "How would you design a REST API for user registration and login?",
                "What is middleware, and how is it used in a backend framework?",
                "How do SQL and NoSQL databases differ?",
                "What are database indexes, and when should you use them?",
                "How would you implement pagination and filtering in an API?",
                "How do promises and async/await work in Node.js?",
                "How would you validate incoming API requests?",
                "How would you implement password hashing securely?",
                "How would you handle API errors consistently?",
                "How would you test backend endpoints?"
            ],
            Advanced: [
                "How would you design a backend architecture for millions of API requests?",
                "How would you prevent SQL injection and other common API vulnerabilities?",
                "How would you design database transactions and handle concurrent updates?",
                "How would you implement distributed caching and cache invalidation?",
                "How would you design idempotent APIs for retryable operations?",
                "How would you investigate high latency across multiple backend services?",
                "How would you implement rate limiting for a public API?",
                "How would you manage database migrations without downtime?",
                "How would you design observability using logs, metrics, and distributed tracing?",
                "How would you make a backend resilient to database and third-party service failures?"
            ]
        },
        "Project-Based": {
            Beginner: [
                "How would you build a simple REST API for managing tasks?",
                "How would you connect a backend API to a database?",
                "How would you implement CRUD operations for a user profile?",
                "How would you validate data submitted through an API?",
                "How would you return appropriate HTTP status codes?",
                "How would you organize routes, controllers, and services in a project?",
                "How would you store database credentials securely?",
                "How would you test an API using Postman?",
                "How would you handle a request for a resource that does not exist?",
                "How would you deploy a basic backend application?"
            ],
            Intermediate: [
                "Design a backend for an online shopping application with products and orders.",
                "How would you implement user authentication using access tokens?",
                "How would you design a database schema for a blog application?",
                "How would you implement role-based access control in an API?",
                "How would you build search, filtering, and pagination for a large dataset?",
                "How would you implement file uploads securely?",
                "How would you add caching to frequently requested API endpoints?",
                "How would you implement background jobs for sending emails?",
                "How would you write integration tests for a backend connected to a database?",
                "How would you troubleshoot an API that works locally but fails after deployment?"
            ],
            Advanced: [
                "Design a scalable backend for a multi-user SaaS application.",
                "How would you design an order-processing system that avoids duplicate payments?",
                "How would you implement reliable communication between microservices?",
                "How would you migrate a large database with minimal downtime?",
                "How would you secure tenant-specific data in a multi-tenant backend?",
                "How would you design a notification service that handles millions of events?",
                "How would you recover from partial failures in a distributed transaction?",
                "How would you implement centralized observability for a production backend?",
                "How would you load-test a service and identify its bottlenecks?",
                "How would you plan a zero-downtime backend deployment with rollback support?"
            ]
        }
    },
        
    "Python Developer": {
        HR: {
            Beginner: [
                "Tell me about yourself and why you want to become a Python Developer.",
                "What interests you about programming with Python?",
                "How did you start learning Python?",
                "Which Python projects have you worked on?",
                "What are your strongest programming skills?",
                "How do you approach solving a coding problem?",
                "How do you learn a new Python library?",
                "How do you debug errors in your code?",
                "How do you manage time when completing a programming task?",
                "What are your career goals as a Python Developer?"
            ],
            Intermediate: [
                "Describe a Python project where you solved a challenging problem.",
                "How do you organize code in a growing Python application?",
                "How do you choose suitable Python libraries for a project?",
                "How do you improve the readability and maintainability of Python code?",
                "Describe how you would investigate a difficult Python bug.",
                "How do you handle changing project requirements?",
                "How do you collaborate with developers using different technologies?",
                "How do you balance development speed with code quality?",
                "How do you keep your Python skills up to date?",
                "How would you explain a complex Python solution to a beginner?"
            ],
            Advanced: [
                "How would you lead the development of a large Python application?",
                "How would you investigate a serious production issue in a Python service?",
                "How would you establish coding standards across a Python development team?",
                "How would you evaluate whether a Python application needs architectural changes?",
                "How would you mentor junior developers in Python best practices?",
                "How would you balance performance optimization with maintainability?",
                "How would you manage technical debt in a long-running Python project?",
                "How would you review a major refactoring proposal?",
                "How would you improve reliability across several Python services?",
                "What would your priorities be in your first 90 days as a senior Python Developer?"
            ]
        },
        Technical: {
            Beginner: [
                "What are the main features of Python?",
                "What is the difference between a list and a tuple?",
                "What is the difference between a dictionary and a set?",
                "What are mutable and immutable objects in Python?",
                "What is the difference between == and is in Python?",
                "How do if, elif, and else statements work?",
                "What is the purpose of a for loop and a while loop?",
                "What are functions, and how do you define them in Python?",
                "How does exception handling work using try and except?",
                "What is the difference between a module and a package?"
            ],
            Intermediate: [
                "What are decorators in Python, and when would you use them?",
                "Explain list comprehensions with an example.",
                "What is a generator, and how does yield work?",
                "How do *args and **kwargs work in Python functions?",
                "What is the difference between shallow copy and deep copy?",
                "How does Python's object-oriented programming model work?",
                "What are instance methods, class methods, and static methods?",
                "How do context managers and the with statement work?",
                "How would you create and manage a virtual environment?",
                "How would you write unit tests using pytest or unittest?"
            ],
            Advanced: [
                "How does Python manage memory and garbage collection?",
                "What is the Global Interpreter Lock, and how does it affect concurrency?",
                "How do threading, multiprocessing, and asyncio differ?",
                "How would you profile and optimize a slow Python application?",
                "How does Python's method resolution order work with multiple inheritance?",
                "How would you design a robust exception-handling strategy for a large application?",
                "How would you structure type hints and static type checking in a large codebase?",
                "How would you identify and fix a memory leak in a long-running Python service?",
                "How would you design a thread-safe component in Python?",
                "How would you package, version, and distribute a reusable Python library?"
            ]
        },
        "Project-Based": {
            Beginner: [
                "How would you build a command-line calculator using Python?",
                "How would you create a program that reads and writes files?",
                "How would you build a contact book using dictionaries and lists?",
                "How would you validate user input in a Python application?",
                "How would you create a program that processes a CSV file?",
                "How would you handle invalid input and unexpected errors?",
                "How would you organize a small Python project into modules?",
                "How would you write tests for a simple Python function?",
                "How would you use a virtual environment to manage dependencies?",
                "How would you create a simple web application using a Python framework?"
            ],
            Intermediate: [
                "Design a Python REST API for managing tasks using Flask or FastAPI.",
                "How would you connect a Python application to a relational database?",
                "How would you build a web scraper that handles errors and respects website rules?",
                "How would you process a large CSV file without loading all its data into memory?",
                "How would you implement authentication and authorization in a Python API?",
                "How would you build a background job that sends scheduled notifications?",
                "How would you write unit and integration tests for a Python service?",
                "How would you package a Python application using Docker?",
                "How would you implement structured logging and configuration management?",
                "How would you deploy and troubleshoot a Python backend application?"
            ],
            Advanced: [
                "Design a scalable Python backend that handles high request volumes.",
                "How would you build an asynchronous API that communicates with multiple external services?",
                "How would you optimize a data-processing pipeline that exceeds available memory?",
                "How would you design reliable background workers with retries and idempotency?",
                "How would you migrate a large Python application to a modular architecture?",
                "How would you secure a Python API against injection, broken access control, and unsafe deserialization?",
                "How would you monitor latency, errors, and resource usage in a production Python service?",
                "How would you design a distributed task-processing system using Python?",
                "How would you test compatibility and prevent regressions across Python versions?",
                "How would you deploy Python service updates with health checks and rollback support?"
            ]
        }
    },
    
    "Generative AI Engineer": {
        HR: {
            Beginner: [
                "Tell me about yourself and why you want to become a Generative AI Engineer.",
                "What interests you about generative artificial intelligence?",
                "What generative AI tools or models have you explored?",
                "How did you start learning about large language models?",
                "What is one practical problem you would like to solve using generative AI?",
                "Describe an AI-related project you have worked on or would like to build.",
                "How do you approach learning rapidly evolving AI technologies?",
                "How do you explain generative AI to a non-technical person?",
                "How do you respond when an AI system produces an incorrect answer?",
                "What are your career goals in generative AI?"
            ],
            Intermediate: [
                "Describe a project where you would use a generative AI model to solve a real problem.",
                "How would you choose an appropriate model for a product requirement?",
                "How do you balance response quality, latency, and inference cost?",
                "How would you investigate inconsistent outputs from an AI model?",
                "How do you evaluate whether a generative AI feature is useful to users?",
                "How would you explain model limitations and hallucinations to stakeholders?",
                "How do you prioritize safety, usability, and development speed?",
                "How would you respond to feedback that an AI feature is unreliable?",
                "How do you keep up with changes in generative AI?",
                "How would you collaborate with software engineers to ship an AI feature?"
            ],
            Advanced: [
                "How would you lead the development of a production-grade generative AI system?",
                "How would you define quality and safety standards for an AI product?",
                "How would you handle a production incident caused by harmful model output?",
                "How would you decide whether to use a hosted model or a self-hosted model?",
                "How would you prioritize model quality improvements against infrastructure costs?",
                "How would you establish an evaluation strategy for a changing AI system?",
                "How would you mentor engineers who are new to generative AI?",
                "How would you communicate the risks of deploying an unproven model?",
                "How would you decide whether fine-tuning is justified for a business use case?",
                "What would your priorities be in your first 90 days as a senior Generative AI Engineer?"
            ]
        },
        Technical: {
            Beginner: [
                "What is generative artificial intelligence?",
                "What is the difference between generative AI and traditional predictive AI?",
                "What is a large language model?",
                "What is a token in a language model?",
                "What is a prompt, and how does it influence a model's output?",
                "What is the difference between training and inference?",
                "What is an embedding, and what is it used for?",
                "What is a hallucination in generative AI?",
                "What is the difference between an LLM and a chatbot application?",
                "Why should an AI application's API key be kept on the backend?"
            ],
            Intermediate: [
                "How does the Transformer architecture use attention?",
                "What is retrieval-augmented generation, and when is it useful?",
                "How would you design a prompt template for a structured response?",
                "How would you evaluate the factual accuracy of generated answers?",
                "What is the difference between fine-tuning and RAG?",
                "How do temperature and top-p affect text generation?",
                "How would you manage token limits and long conversations?",
                "How would you reduce latency and cost when calling an LLM API?",
                "How would you detect and mitigate prompt injection?",
                "How would you test an application when model responses are nondeterministic?"
            ],
            Advanced: [
                "How would you design a scalable generative AI inference architecture?",
                "How would you build an evaluation framework for model quality and groundedness?",
                "How would you compare candidate models across accuracy, latency, cost, and safety?",
                "How would you optimize inference using batching, caching, and quantization?",
                "How would you design a robust RAG pipeline with document-level access control?",
                "How would you mitigate prompt injection and data exfiltration in an LLM application?",
                "How would you implement model routing and fallback across multiple providers?",
                "How would you detect model regressions after a prompt or model update?",
                "How would you evaluate whether fine-tuning improves performance over a baseline?",
                "How would you monitor and govern a generative AI system in production?"
            ]
        },
        "Project-Based": {
            Beginner: [
                "How would you build a basic AI chatbot using an LLM API?",
                "How would you create a web interface that displays generated responses?",
                "How would you handle loading states and failed AI requests?",
                "How would you keep model API credentials secure?",
                "How would you build a prompt-based text summarizer?",
                "How would you create a tool that generates structured JSON output?",
                "How would you validate user input before sending it to a model?",
                "How would you save and display previous chatbot conversations?",
                "How would you test a simple generative AI feature?",
                "How would you deploy a small generative AI application?"
            ],
            Intermediate: [
                "Design a document assistant that answers questions using RAG.",
                "How would you build a meeting summarizer that extracts action items?",
                "How would you implement conversation history with context limits?",
                "How would you create a system that generates content in a required format?",
                "How would you build a support assistant that uses an approved knowledge base?",
                "How would you evaluate answers against a set of reference questions?",
                "How would you add authentication and isolate each user's data?",
                "How would you implement retries and rate-limit handling for an LLM API?",
                "How would you build a model comparison dashboard for different prompts?",
                "How would you deploy and monitor a generative AI backend?"
            ],
            Advanced: [
                "Design a multi-tenant generative AI platform with secure RAG and conversation history.",
                "How would you build a production evaluation pipeline for hallucination and relevance?",
                "How would you design an AI agent that uses tools with permission checks?",
                "How would you protect confidential documents throughout ingestion, retrieval, and generation?",
                "How would you optimize a high-volume LLM application for cost and latency?",
                "How would you roll out a new model while measuring quality against the existing version?",
                "How would you build reliable fallback behavior when all primary model providers fail?",
                "How would you implement audit logging and observability for AI-generated actions?",
                "How would you design human review for high-impact or uncertain AI outputs?",
                "How would you run a security and quality assessment before launching a public AI product?"
            ]
        }
    },

    
    "LLM Application Developer": {
        HR: {
            Beginner: [
                "Tell me about yourself and why you want to become an LLM Application Developer.",
                "What interests you about building applications with large language models?",
                "Which LLM tools or APIs have you explored?",
                "How did you start learning about language models?",
                "What practical problem would you like to solve using an LLM?",
                "Describe an AI application you have built or would like to build.",
                "How do you approach learning a new AI framework?",
                "How would you explain an LLM application to a non-technical person?",
                "How would you respond if an LLM returned an incorrect answer?",
                "What are your career goals in LLM application development?"
            ],
            Intermediate: [
                "Describe an application where you would integrate an LLM into an existing workflow.",
                "How would you choose an LLM provider for a project?",
                "How do you balance response quality, latency, and API cost?",
                "How would you investigate inconsistent model responses?",
                "How would you measure whether an LLM feature meets user needs?",
                "How would you explain hallucinations and model limitations to stakeholders?",
                "How would you respond to users reporting inaccurate AI answers?",
                "How do you prioritize security and usability in an LLM application?",
                "How do you keep up with changes in LLM APIs and frameworks?",
                "How would you collaborate with frontend and backend developers on an AI feature?"
            ],
            Advanced: [
                "How would you lead the delivery of a reliable, production-grade LLM application?",
                "How would you handle a production incident involving unsafe or incorrect generated content?",
                "How would you decide between a hosted LLM API and a self-hosted model?",
                "How would you establish quality standards for an LLM-powered product?",
                "How would you balance model quality improvements against operating costs?",
                "How would you evaluate the risks of using an external LLM provider?",
                "How would you mentor developers new to LLM application engineering?",
                "How would you communicate an LLM application's limitations to business leaders?",
                "How would you decide whether an application needs RAG, fine-tuning, or neither?",
                "What would your priorities be in your first 90 days as a senior LLM Application Developer?"
            ]
        },
        Technical: {
            Beginner: [
                "What is a large language model?",
                "What is the difference between an LLM and a traditional rule-based program?",
                "What is a prompt, and how does it affect model output?",
                "What is a token in an LLM?",
                "What is an LLM API?",
                "What is the difference between training and inference?",
                "What is a context window?",
                "What is a hallucination in an LLM response?",
                "What is an embedding, and why can it be useful?",
                "Why should an LLM API key be stored on the backend?"
            ],
            Intermediate: [
                "How would you integrate an LLM API into a REST backend?",
                "What is retrieval-augmented generation, and when should it be used?",
                "How would you request and validate structured JSON output from an LLM?",
                "How do temperature and top-p affect generated responses?",
                "How would you manage conversation history within a context window?",
                "How would you handle rate limits, timeouts, and provider errors?",
                "How would you evaluate response relevance and factual accuracy?",
                "How would you defend an LLM application against prompt injection?",
                "How would you reduce token usage without significantly reducing answer quality?",
                "How would you test an application whose LLM responses vary between runs?"
            ],
            Advanced: [
                "How would you design a scalable LLM application supporting concurrent users?",
                "How would you build an evaluation framework for correctness, groundedness, and relevance?",
                "How would you implement model routing across providers based on task, latency, and cost?",
                "How would you design a RAG pipeline with document-level authorization?",
                "How would you mitigate prompt injection and prevent sensitive data leakage?",
                "How would you optimize inference latency using caching, streaming, and parallel calls?",
                "How would you handle model-provider outages with retries and fallbacks?",
                "How would you detect quality regressions after changing a model or prompt?",
                "How would you decide whether fine-tuning is better than prompt engineering or RAG?",
                "How would you monitor cost, latency, reliability, and safety in production?"
            ]
        },
        "Project-Based": {
            Beginner: [
                "How would you build a basic chatbot using an LLM API?",
                "How would you connect a web form to an LLM backend endpoint?",
                "How would you show loading and error states while waiting for an answer?",
                "How would you securely store the API credentials for an LLM provider?",
                "How would you build an application that summarizes a paragraph?",
                "How would you ask an LLM to return a response in a specific format?",
                "How would you validate user input before sending it to a model?",
                "How would you save and display a user's previous conversations?",
                "How would you test a simple LLM-powered feature?",
                "How would you deploy a basic LLM application?"
            ],
            Intermediate: [
                "Design a document-question-answering application using RAG.",
                "How would you build an AI assistant that summarizes uploaded files?",
                "How would you implement conversation history with token limits?",
                "How would you build an LLM-powered support assistant using approved knowledge sources?",
                "How would you create an application that extracts structured data from text?",
                "How would you compare multiple prompts using a fixed evaluation dataset?",
                "How would you add user authentication and isolate each user's conversations?",
                "How would you implement retries and graceful error handling for an LLM API?",
                "How would you build a dashboard comparing response quality and cost across models?",
                "How would you deploy and monitor an LLM backend?"
            ],
            Advanced: [
                "Design a multi-tenant LLM application with secure RAG and conversation history.",
                "How would you build an automated evaluation pipeline for factual accuracy and relevance?",
                "How would you design an LLM agent that uses external tools safely?",
                "How would you secure document ingestion, retrieval, and generation for private user files?",
                "How would you optimize a high-volume LLM application for cost and latency?",
                "How would you roll out a new model while comparing it against the existing version?",
                "How would you implement provider failover without losing conversation state?",
                "How would you audit LLM outputs and tool calls in a production application?",
                "How would you introduce human approval for sensitive or high-impact actions?",
                "How would you test an LLM application for security and quality before public release?"
            ]
        }
    },

    "Data Scientist": {
        HR: {
            Beginner: [
                "Tell me about yourself and why you want to become a Data Scientist.",
                "What interests you about working with data?",
                "Which data analysis tools have you learned?",
                "How did you start learning statistics or machine learning?",
                "Describe a data-related project you have completed or would like to build.",
                "How do you approach a problem when the data is unfamiliar?",
                "How do you explain a technical finding to a non-technical person?",
                "How do you handle mistakes or unexpected results in your analysis?",
                "How do you keep learning new data science techniques?",
                "What are your career goals in data science?"
            ],
            Intermediate: [
                "Describe a data science project where you extracted useful insights from data.",
                "How do you decide which analytical approach to use for a business problem?",
                "How do you handle ambiguous requirements from stakeholders?",
                "How would you explain a model's limitations to a business team?",
                "How do you balance model complexity with interpretability?",
                "How do you prioritize competing data analysis requests?",
                "How do you investigate unexpected changes in model performance?",
                "How do you communicate uncertainty in your findings?",
                "How do you collaborate with data engineers and software developers?",
                "How do you keep your data science skills up to date?"
            ],
            Advanced: [
                "How would you lead a data science project from business discovery to deployment?",
                "How would you decide whether a business problem needs machine learning?",
                "How would you resolve disagreement about the interpretation of analytical results?",
                "How would you establish standards for reproducible data science work?",
                "How would you prioritize model accuracy, interpretability, and business impact?",
                "How would you communicate the risks of using biased or incomplete data?",
                "How would you mentor junior data scientists?",
                "How would you evaluate the business value of a deployed model?",
                "How would you handle a model that performs well technically but fails to improve business outcomes?",
                "What would your priorities be in your first 90 days as a senior Data Scientist?"
            ]
        },
        Technical: {
            Beginner: [
                "What is data science, and how does it differ from data analysis?",
                "What is the difference between supervised and unsupervised learning?",
                "What are mean, median, and mode?",
                "What is the difference between a population and a sample?",
                "What are features and labels in machine learning?",
                "What is the purpose of training and testing datasets?",
                "What is data cleaning, and why is it important?",
                "What is the difference between a list and a DataFrame in Python?",
                "What is correlation, and does it imply causation?",
                "What are accuracy, precision, and recall?"
            ],
            Intermediate: [
                "How would you handle missing values and outliers in a dataset?",
                "What is the bias-variance trade-off?",
                "How do you detect and prevent data leakage?",
                "How do one-hot encoding and standardization work?",
                "How would you evaluate a classification model on an imbalanced dataset?",
                "What is cross-validation, and why is it useful?",
                "How do linear regression and logistic regression differ?",
                "How would you select relevant features for a model?",
                "How would you investigate multicollinearity in regression?",
                "How would you explain feature importance to a stakeholder?"
            ],
            Advanced: [
                "How would you design a statistically sound experiment to measure a product change?",
                "How would you detect data drift and model performance degradation?",
                "How would you evaluate causal impact rather than simple correlation?",
                "How would you design a robust validation strategy for time-series data?",
                "How would you compare models while controlling for selection bias?",
                "How would you handle high-dimensional data with limited training examples?",
                "How would you assess calibration and uncertainty in model predictions?",
                "How would you investigate fairness across different user groups?",
                "How would you design a reproducible pipeline for feature engineering and model training?",
                "How would you choose evaluation metrics when false positives and false negatives have different costs?"
            ]
        },
        "Project-Based": {
            Beginner: [
                "How would you analyze a CSV dataset using Python and pandas?",
                "How would you visualize the distribution of a numerical feature?",
                "How would you investigate missing values in a customer dataset?",
                "How would you create a simple dashboard of key business metrics?",
                "How would you build a basic classification model using scikit-learn?",
                "How would you split data into training and testing sets?",
                "How would you evaluate and explain a model's predictions?",
                "How would you identify duplicate records in a dataset?",
                "How would you write a report summarizing your data analysis?",
                "How would you turn a notebook-based analysis into a reusable Python script?"
            ],
            Intermediate: [
                "Design a customer churn prediction project from data cleaning to model evaluation.",
                "How would you build a sales forecasting model using historical data?",
                "How would you segment customers using clustering techniques?",
                "How would you compare multiple classification models fairly?",
                "How would you build a recommendation system for products or content?",
                "How would you analyze an A/B test and determine whether a change had an effect?",
                "How would you build a data pipeline that refreshes a model's input data?",
                "How would you deploy a trained model behind a REST API?",
                "How would you create an interactive dashboard for model performance and business outcomes?",
                "How would you troubleshoot a model that performs well in training but poorly on new data?"
            ],
            Advanced: [
                "Design an end-to-end data science platform with reproducible training and model deployment.",
                "How would you build a real-time fraud detection model with strict latency requirements?",
                "How would you design an experimentation framework for product decisions?",
                "How would you detect and respond to data drift in a deployed prediction system?",
                "How would you evaluate a recommendation system when user feedback is biased?",
                "How would you build a time-series forecasting system with changing seasonal patterns?",
                "How would you establish model governance, auditability, and reproducibility?",
                "How would you optimize model quality while meeting inference-cost constraints?",
                "How would you monitor fairness and reliability after a model is deployed?",
                "How would you design a safe retraining and rollback process for a production model?"
            ]
        }
    },

    "Data Analyst": {
        HR: {
            Beginner: [
                "Tell me about yourself and why you want to become a Data Analyst.",
                "What interests you about working with data?",
                "Which data analysis tools have you learned?",
                "Why is data quality important in decision-making?",
                "Describe a data-related project you have completed or would like to build.",
                "How do you approach a problem when the available data is unfamiliar?",
                "How would you explain a chart or report to a non-technical person?",
                "How do you handle mistakes or unexpected results in your analysis?",
                "How do you keep learning new data analysis techniques?",
                "What are your career goals as a Data Analyst?"
            ],
            Intermediate: [
                "Describe a project where your analysis helped answer a business question.",
                "How do you prioritize multiple requests for reports or analysis?",
                "How do you handle unclear requirements from stakeholders?",
                "How would you explain an unexpected trend in a dashboard?",
                "How do you ensure that your analysis is accurate and reproducible?",
                "How do you communicate uncertainty or limitations in a report?",
                "How do you handle disagreements about the interpretation of data?",
                "How do you balance quick reporting with thorough validation?",
                "How do you collaborate with business teams and data engineers?",
                "How do you keep your SQL, spreadsheet, and visualization skills up to date?"
            ],
            Advanced: [
                "How would you lead an analytics project from stakeholder discovery to recommendations?",
                "How would you establish consistent metric definitions across departments?",
                "How would you resolve conflicting reports that use different business logic?",
                "How would you prioritize analytics requests with limited team capacity?",
                "How would you evaluate the business impact of a dashboard or reporting initiative?",
                "How would you communicate a finding that contradicts a senior stakeholder's assumption?",
                "How would you mentor junior analysts in analytical thinking and data quality?",
                "How would you establish standards for trustworthy dashboards and reports?",
                "How would you distinguish a meaningful business change from random variation?",
                "What would your priorities be in your first 90 days as a senior Data Analyst?"
            ]
        },
        Technical: {
            Beginner: [
                "What is data analysis, and how does it support business decisions?",
                "What is the difference between structured and unstructured data?",
                "What is SQL, and why is it used in data analysis?",
                "What is the difference between WHERE and HAVING in SQL?",
                "What is the difference between INNER JOIN and LEFT JOIN?",
                "What are NULL values, and how can you handle them in SQL?",
                "What are mean, median, and mode?",
                "What is the difference between a bar chart and a line chart?",
                "What is data cleaning, and why is it important?",
                "What is the difference between a primary key and a foreign key?"
            ],
            Intermediate: [
                "How would you use GROUP BY and aggregate functions to summarize sales data?",
                "What are window functions in SQL, and when would you use them?",
                "How would you identify duplicate records in a dataset?",
                "How would you investigate missing or inconsistent values?",
                "How do you choose an appropriate visualization for a business metric?",
                "What is the difference between correlation and causation?",
                "How would you analyze month-over-month and year-over-year growth?",
                "How would you use a pivot table to summarize a large dataset?",
                "How would you validate the results of a complex SQL query?",
                "What is the difference between an inner join and a full outer join?"
            ],
            Advanced: [
                "How would you optimize a slow analytical SQL query on a large dataset?",
                "How would you design a reliable set of business metrics for an executive dashboard?",
                "How would you investigate a sudden change in a key performance indicator?",
                "How would you detect selection bias in a business analysis?",
                "How would you evaluate whether a marketing campaign caused an increase in sales?",
                "How would you design a dashboard that supports both executive summaries and detailed investigation?",
                "How would you handle slowly changing dimensions in an analytical data model?",
                "How would you identify and prevent double-counting across joined datasets?",
                "How would you distinguish seasonality from a genuine trend in time-series data?",
                "How would you build automated data-quality checks for recurring reports?"
            ]
        },
        "Project-Based": {
            Beginner: [
                "How would you analyze a CSV file using Python and pandas?",
                "How would you clean a dataset containing missing values and duplicates?",
                "How would you create a chart showing monthly sales?",
                "How would you write a SQL query to find the top five products by revenue?",
                "How would you build a spreadsheet report using formulas and pivot tables?",
                "How would you summarize customer feedback into useful categories?",
                "How would you create a simple dashboard of key business metrics?",
                "How would you check whether a report contains incorrect values?",
                "How would you document the steps used to clean a dataset?",
                "How would you present three important findings from a dataset?"
            ],
            Intermediate: [
                "Design a sales performance dashboard for a retail business.",
                "How would you analyze customer churn using SQL and exploratory data analysis?",
                "How would you build a report comparing actual sales against targets?",
                "How would you analyze customer segments and purchasing behavior?",
                "How would you investigate why website conversion rates declined?",
                "How would you combine data from multiple tables to create a business report?",
                "How would you automate a recurring report using Python?",
                "How would you design a dashboard with filters, drill-downs, and date ranges?",
                "How would you measure the results of a marketing campaign?",
                "How would you validate a dashboard before sharing it with management?"
            ],
            Advanced: [
                "Design an end-to-end analytics solution for monitoring business performance.",
                "How would you create a single source of truth for revenue and customer metrics?",
                "How would you investigate conflicting KPI values across several dashboards?",
                "How would you evaluate the incremental impact of a marketing campaign?",
                "How would you design an analytics data model for multiple business departments?",
                "How would you automate data validation and alerting for critical reports?",
                "How would you analyze a large dataset efficiently when memory and query costs are limited?",
                "How would you build a dashboard that detects anomalies in operational metrics?",
                "How would you communicate a complex analysis with uncertainty to executives?",
                "How would you establish governance, documentation, and access controls for a shared analytics environment?"
            ]
        }
    },

"Data Engineer": {
    HR: {
    Beginner: [
        "Tell me about yourself and why you want to become a Data Engineer.",
        "What do you understand by data engineering?",
        "Why are you interested in working with data pipelines?",
        "What skills should a Data Engineer have?",
        "What is the difference between a Data Engineer and a Data Analyst?",
        "Why is data quality important?",
        "How do you approach learning a new technology?",
        "How do you handle repetitive technical tasks?",
        "Describe a technical problem you solved.",
        "What are your career goals as a Data Engineer?"
    ],
    Intermediate: [
        "Describe a data engineering project you have worked on.",
        "How do you prioritize multiple data pipeline failures?",
        "How would you explain a complex data pipeline to a non-technical stakeholder?",
        "Tell me about a time you improved a data processing workflow.",
        "How do you handle changing requirements in a data project?",
        "How do you ensure the reliability of your work?",
        "Describe a time you had to debug an unfamiliar system.",
        "How do you collaborate with Data Scientists and analysts?",
        "How do you stay updated with data engineering technologies?",
        "What would you do if a production data pipeline repeatedly failed?"
        ],
        Advanced: [
        "How would you design a data platform for a rapidly growing organization?",
        "How do you balance data quality, latency, and processing cost?",
        "Describe how you would handle a major production data incident.",
        "How would you establish data engineering standards across a team?",
        "How do you evaluate whether to build or adopt a data platform component?",
        "How would you communicate the impact of data downtime to leadership?",
        "How do you mentor junior engineers in data pipeline development?",
        "How would you manage conflicting priorities across data teams?",
        "What factors influence your choice of a data architecture?",
        "How would you measure the long-term success of a data platform?"
        ]
    },

    Technical: {
        Beginner: [
        "What is data engineering?",
        "What is the difference between structured and unstructured data?",
        "What is ETL, and what do its three stages mean?",
        "What is the difference between SQL and NoSQL databases?",
        "What is a primary key in a relational database?",
        "What is the difference between a row and a column?",
        "What is a data warehouse?",
        "What is a data lake?",
        "What is the difference between batch and stream processing?",
        "What is the purpose of Python in data engineering?"
    ],
    Intermediate: [
        "What is the difference between ETL and ELT?",
        "Explain the difference between a data lake and a data warehouse.",
        "What is Apache Spark, and when would you use it?",
        "What is Apache Kafka, and how does it support streaming data?",
        "Explain fact tables and dimension tables in a star schema.",
        "What is database partitioning, and why is it useful?",
        "How do database indexes improve query performance?",
        "How would you implement incremental data loading?",
        "How do you handle duplicate and missing records in a pipeline?",
        "What is orchestration, and how does Apache Airflow help?"
    ],
    Advanced: [
        "How would you design a fault-tolerant, large-scale data pipeline?",
        "Explain exactly-once, at-least-once, and at-most-once processing semantics.",
        "How do you handle late-arriving data in a streaming pipeline?",
        "How would you implement schema evolution without breaking downstream consumers?",
        "Explain slowly changing dimensions, including Type 1 and Type 2.",
        "How would you optimize a slow Spark job involving large joins?",
        "What causes data skew in distributed processing, and how can you mitigate it?",
        "How would you design an idempotent data ingestion process?",
        "How do you implement data lineage, observability, and quality checks?",
        "How would you secure sensitive data across a cloud-based data platform?"
        ]
    },

    "Project-Based": {
        Beginner: [
        "Describe a project in which you collected and processed data.",
        "What problem did your data engineering project solve?",
        "Which programming language and tools did you use?",
        "Where did your source data come from?",
        "How did you clean missing or invalid data?",
        "How did you store the processed data?",
        "What transformations did you perform?",
        "How did you test whether your output was correct?",
        "What challenges did you face while building the project?",
        "What would you improve if you rebuilt the project?"
        ],
        Intermediate: [
        "Walk me through the architecture of your ETL pipeline.",
        "How did you schedule and automate data ingestion?",
        "How did you handle failures during data processing?",
        "How did you validate data quality at each pipeline stage?",
        "How did you prevent duplicate records during ingestion?",
        "How did you optimize SQL queries or data transformations?",
        "How did you handle changes in the source data schema?",
        "How did you monitor pipeline execution and troubleshoot errors?",
        "How did you manage configuration and credentials securely?",
        "How did you measure your project's performance and reliability?"
        ],
        Advanced: [
        "Redesign your project to process ten times more data. What would change?",
        "How would you migrate your pipeline from batch processing to streaming?",
        "How would you recover from partial pipeline failure without duplicating data?",
        "How would you support backfills while new data continues arriving?",
        "How would you reduce cloud processing costs without compromising reliability?",
        "How would you design disaster recovery for your data platform?",
        "How would you enforce data contracts between producers and consumers?",
        "How would you investigate a sudden increase in pipeline processing time?",
        "How would you implement end-to-end lineage and impact analysis?",
        "How would you make your project production-ready for multiple teams?"
    ]
    }
},
    "Cloud/DevOps Engineer": {
    HR: {
        Beginner: [
        "Tell me about yourself and why you want to become a Cloud/DevOps Engineer.",
        "What interests you about cloud computing and automation?",
        "What do you understand by DevOps?",
        "Why are collaboration and communication important in DevOps?",
        "What skills are important for a Cloud/DevOps Engineer?",
        "What is your favorite technical tool and why?",
        "How do you learn a new technology?",
        "How do you handle repetitive technical work?",
        "Describe a technical problem you solved.",
        "What are your career goals in cloud and DevOps?"
        ],
        Intermediate: [
        "Describe a cloud or automation project you have worked on.",
        "How do you prioritize incidents and routine engineering tasks?",
        "Tell me about a time you automated a manual process.",
        "How would you handle a deployment that failed just before a deadline?",
        "How do you collaborate with developers and operations teams?",
        "How do you respond to feedback on your infrastructure design?",
        "Describe a time you diagnosed a difficult technical issue.",
        "How do you keep your cloud skills up to date?",
        "How would you explain a production outage to a non-technical stakeholder?",
        "What would you do if a team repeatedly bypassed deployment procedures?"
        ],
        Advanced: [
        "How would you build a culture of reliability and shared ownership?",
        "How do you balance delivery speed, stability, security, and cost?",
        "Describe your approach to leading a major production incident.",
        "How would you introduce DevOps practices to a traditional organization?",
        "How do you decide whether to adopt a new cloud service?",
        "How would you establish infrastructure standards across multiple teams?",
        "How do you mentor engineers in automation and cloud architecture?",
        "How would you handle disagreements over deployment risk?",
        "How do you measure the business impact of DevOps improvements?",
        "What would your long-term cloud platform strategy look like?"
        ]
    },

    Technical: {
        Beginner: [
        "What is cloud computing?",
        "What is the difference between IaaS, PaaS, and SaaS?",
        "What is DevOps, and what problems does it solve?",
        "What is the difference between continuous integration and continuous delivery?",
        "What is a virtual machine?",
        "What is Docker, and why is it used?",
        "What is the purpose of Git in a DevOps workflow?",
        "What is a CI/CD pipeline?",
        "What is the difference between public, private, and hybrid clouds?",
        "What is the purpose of monitoring and logging?"
        ],
        Intermediate: [
        "What is the difference between containers and virtual machines?",
        "How does Docker image layering work?",
        "What are the main components of a Kubernetes cluster?",
        "How would you build a CI/CD pipeline for a web application?",
        "What is Infrastructure as Code, and how does Terraform help?",
        "What is the difference between a load balancer and an API gateway?",
        "How do you manage environment variables and secrets securely?",
        "What is the difference between horizontal and vertical scaling?",
        "How do you investigate a Linux server with high CPU usage?",
        "How would you configure alerts for a production service?"
        ],
        Advanced: [
        "How would you design a highly available, multi-region cloud architecture?",
        "How would you implement blue-green and canary deployments?",
        "How do you manage Terraform state and prevent concurrent state changes?",
        "How would you troubleshoot a Kubernetes pod stuck in CrashLoopBackOff?",
        "How would you implement least-privilege access across cloud accounts?",
        "How would you design secure networking for a multi-tier application?",
        "How do you implement disaster recovery and define RPO and RTO?",
        "How would you diagnose intermittent latency across distributed services?",
        "How would you implement supply-chain security in a CI/CD pipeline?",
        "How would you optimize cloud costs while meeting reliability objectives?"
        ]
    },

    "Project-Based": {
            Beginner: [
        "Describe a project where you deployed an application to a server or cloud platform.",
        "What problem did your deployment project solve?",
        "Which cloud platform or hosting service did you use?",
        "How did you manage your project's source code?",
        "How did you configure the application environment?",
        "How did you build or package your application?",
        "How did you test the application after deployment?",
        "How did you check whether the application was running correctly?",
        "What deployment challenges did you face?",
        "What would you improve if you rebuilt the project?"
        ],
        Intermediate: [
        "Walk me through your project's CI/CD pipeline.",
        "How did you automate the build and deployment process?",
        "How did you manage configuration across development and production?",
        "How did you handle failed deployments?",
        "How did you containerize your application?",
        "How did you monitor application health and performance?",
        "How did you manage credentials and secrets?",
        "How did you investigate deployment or server errors?",
        "How did you reduce deployment downtime?",
        "How did you manage infrastructure changes and version control?"
        ],
        Advanced: [
        "How would you redesign your project to support ten times more traffic?",
        "How would you deploy the application across multiple availability zones?",
        "How would you implement a zero-downtime deployment strategy?",
        "How would you recover from a failed infrastructure change?",
        "How would you introduce automated security checks into your pipeline?",
        "How would you design disaster recovery for your project?",
        "How would you identify and reduce unnecessary cloud spending?",
        "How would you investigate a production incident affecting only some users?",
        "How would you implement policy-as-code and infrastructure compliance?",
        "How would you make your project production-ready for multiple teams?"
    ]
    }
},


    "Cybersecurity Engineer": {
    HR: {
            Beginner: [
        "Tell me about yourself and why you want to work in cybersecurity.",
        "What interests you most about protecting systems and data?",
        "What do you understand by cybersecurity?",
        "Why is confidentiality important in information security?",
        "What skills should a Cybersecurity Engineer develop?",
        "How do you stay updated about security threats?",
        "How do you approach learning a new security tool?",
        "How do you handle a difficult technical problem?",
        "Describe a time you worked carefully to avoid mistakes.",
        "What are your career goals in cybersecurity?"
        ],
        Intermediate: [
        "Describe a cybersecurity project you have worked on.",
        "How would you prioritize several reported security vulnerabilities?",
        "Tell me about a time you identified and resolved a technical issue.",
        "How would you communicate a security risk to a non-technical manager?",
        "How do you balance security requirements with usability?",
        "What would you do if a teammate ignored a security procedure?",
        "How do you handle sensitive information during an investigation?",
        "How do you respond when your initial security hypothesis is incorrect?",
        "How would you keep your skills relevant as threats evolve?",
        "What would you do if you suspected a security incident during a deadline?"
        ],
        Advanced: [
        "How would you build a security-first engineering culture?",
        "How do you balance security, usability, delivery speed, and cost?",
        "How would you lead a response to a serious security incident?",
        "How would you explain an organization's exposure to senior leadership?",
        "How would you prioritize security investments with a limited budget?",
        "How would you establish consistent security practices across teams?",
        "How would you mentor engineers on secure development?",
        "How would you manage disagreement about the severity of a vulnerability?",
        "Which metrics would you use to measure security program effectiveness?",
        "How would you plan a long-term security improvement roadmap?"
        ]
    },

    Technical: {
        Beginner: [
        "What is the CIA triad in information security?",
        "What is the difference between authentication and authorization?",
        "What is the difference between symmetric and asymmetric encryption?",
        "What is phishing, and how can users recognize it?",
        "What is a firewall, and what does it do?",
        "What is multi-factor authentication?",
        "What is the difference between a vulnerability, a threat, and a risk?",
        "What is malware? Give examples of common types.",
        "What is the purpose of hashing passwords?",
        "What is the difference between HTTP and HTTPS?"
        ],
        Intermediate: [
        "What is the difference between IDS and IPS?",
        "How does a TLS handshake help secure communication?",
        "What is SQL injection, and how can developers prevent it?",
        "What is cross-site scripting (XSS), and how can it be mitigated?",
        "How does role-based access control work?",
        "What are the main steps in vulnerability management?",
        "How would you investigate suspicious authentication logs?",
        "What is the principle of least privilege?",
        "How do SIEM systems help security teams?",
        "What is the difference between hashing, encryption, and encoding?"
        ],
        Advanced: [
        "How would you design a zero-trust security architecture?",
        "How would you investigate a suspected compromise of privileged credentials?",
        "How do you prioritize vulnerabilities using severity and business context?",
        "How would you secure a cloud-native application across its lifecycle?",
        "How would you design a threat detection strategy for a distributed environment?",
        "How would you preserve evidence during a digital forensics investigation?",
        "How would you reduce the risk of software supply-chain attacks?",
        "How would you design secure key management and rotation?",
        "How would you respond to a ransomware incident while preserving evidence?",
        "How would you build a defense-in-depth strategy for a critical service?"
        ]
    },

    "Project-Based": {
        Beginner: [
        "Describe a cybersecurity project you built or contributed to.",
        "What security problem did your project aim to solve?",
        "Which programming languages and tools did you use?",
        "What data or test environment did you use?",
        "How did you identify the security issue your project addressed?",
        "How did you test whether your solution worked?",
        "How did you handle false positives or incorrect results?",
        "How did you document your project's findings?",
        "What was the biggest challenge in your project?",
        "What would you improve if you rebuilt the project?"
        ],
        Intermediate: [
        "Walk me through your project's architecture and security workflow.",
        "How did you validate the accuracy of your detection methods?",
        "How did you prioritize the vulnerabilities your project identified?",
        "How did you protect sensitive information in your test data?",
        "How did you handle false positives and false negatives?",
        "How did you log and investigate security-related events?",
        "How did you test your solution against different attack scenarios in an authorized environment?",
        "How did you measure the effectiveness of your security controls?",
        "How did you document limitations and remediation steps?",
        "How did you make your project easier to maintain and extend?"
        ],
        Advanced: [
        "How would you adapt your project to protect an enterprise-scale environment?",
        "How would you reduce false positives without missing serious threats?",
        "How would you integrate your solution with a SIEM or incident-response workflow?",
        "How would you protect the project itself against tampering and unauthorized access?",
        "How would you design a safe process for testing security controls?",
        "How would you evaluate detection performance using realistic test scenarios?",
        "How would you handle sensitive logs while meeting retention requirements?",
        "How would you prioritize remediation when many systems are affected?",
        "How would you monitor your solution for drift and changing threat patterns?",
        "How would you make the project production-ready, auditable, and scalable?"
    ]
    }
},

    "Software Engineer": {
    HR: {
        Beginner: [
        "Tell me about yourself and why you want to become a Software Engineer.",
        "What interests you most about software development?",
        "What do you understand by the software development life cycle?",
        "Which programming languages are you most comfortable with?",
        "What are the qualities of a good Software Engineer?",
        "How do you approach learning a new programming language?",
        "How do you manage your time when completing an assignment?",
        "Describe a technical problem you solved.",
        "How do you respond when your code does not work as expected?",
        "What are your career goals as a Software Engineer?"
        ],
        Intermediate: [
        "Describe a software project you have worked on and your contribution.",
        "How do you prioritize tasks when several features are due?",
        "Tell me about a difficult bug you resolved.",
        "How do you handle constructive feedback during code reviews?",
        "How do you collaborate with designers, testers, and other developers?",
        "What would you do if you disagreed with a proposed technical solution?",
        "How do you balance code quality with delivery deadlines?",
        "Describe a time you had to learn a new technology quickly.",
        "How do you approach maintaining someone else's code?",
        "What would you do if a feature you developed caused a production issue?"
        ],
        Advanced: [
        "How would you lead the technical design of a complex software product?",
        "How do you balance maintainability, performance, security, and delivery speed?",
        "How would you guide a team through a major production incident?",
        "How do you decide when to refactor existing code?",
        "How would you handle disagreement about a significant architectural decision?",
        "How would you establish consistent engineering standards across a team?",
        "How do you mentor junior developers while meeting delivery commitments?",
        "How would you reduce technical debt in a mature codebase?",
        "Which engineering metrics would you use to assess software quality?",
        "How would you plan the long-term evolution of a software system?"
        ]
    },

    Technical: {
        Beginner: [
        "What is the difference between a compiler and an interpreter?",
        "What are variables and data types?",
        "What is the difference between a stack and a queue?",
        "Explain the four main principles of object-oriented programming.",
        "What is the difference between a class and an object?",
        "What is the difference between an array and a linked list?",
        "What is a function, and why is it useful?",
        "What is the difference between syntax errors and logical errors?",
        "What is Git, and why is version control important?",
        "What is the difference between frontend and backend development?"
        ],
        Intermediate: [
        "Explain the difference between an abstract class and an interface.",
        "What are the SOLID principles of object-oriented design?",
        "What is the difference between process-based and thread-based execution?",
        "Explain time complexity and space complexity with examples.",
        "What is the difference between REST APIs and GraphQL?",
        "How do database indexes improve query performance?",
        "What are unit tests, integration tests, and end-to-end tests?",
        "Explain common HTTP status codes and when they are used.",
        "What is the difference between authentication and authorization?",
        "How do you identify and fix a memory leak in an application?"
        ],
        Advanced: [
        "How would you design a scalable, highly available software system?",
        "Explain common software design patterns and when you would use them.",
        "How would you investigate a race condition in a concurrent application?",
        "How do you maintain consistency when several services update related data?",
        "What are the trade-offs between a monolithic and microservices architecture?",
        "How would you design a resilient API with retries, timeouts, and rate limits?",
        "How would you optimize a service with high latency and heavy database usage?",
        "How do you implement backward-compatible API and database changes?",
        "How would you identify and mitigate security vulnerabilities in a codebase?",
        "How would you design an observability strategy for a distributed application?"
        ]
    },

    "Project-Based": {
        Beginner: [
        "Describe a software project you built and the problem it solves.",
        "What was your role in the project?",
        "Which programming languages and frameworks did you use?",
        "How did you organize your source code?",
        "How did you design the user interface or application workflow?",
        "How did your application store or retrieve data?",
        "How did you test whether your application worked correctly?",
        "What was the biggest challenge you faced during development?",
        "How did you use Git or another version-control system?",
        "What would you improve if you rebuilt the project?"
        ],
        Intermediate: [
        "Walk me through your project's architecture and major components.",
        "Why did you choose your technology stack?",
        "How did you design and validate your database schema?",
        "How did the frontend communicate with the backend?",
        "How did you handle errors and invalid user input?",
        "What testing strategy did you use, and why?",
        "How did you identify and resolve performance bottlenecks?",
        "How did you manage configuration and sensitive credentials?",
        "How did you deploy your project and verify that it worked in production?",
        "How did you manage changes when project requirements evolved?"
        ],
        Advanced: [
        "How would you redesign your project to support ten times more users?",
        "How would you separate components that have become tightly coupled?",
        "How would you introduce caching without serving stale or incorrect data?",
        "How would you make your application resilient to database or service failures?",
        "How would you implement zero-downtime deployments for your project?",
        "How would you investigate a performance problem occurring only in production?",
        "How would you improve security across authentication, APIs, and data storage?",
        "How would you design a migration that changes your database schema safely?",
        "How would you monitor application health and diagnose incidents?",
        "What architectural improvements would you prioritize before making the project production-ready?"
        ]
    }
    },

  "Full-Stack Developer": {
    HR: {
        Beginner: [
        "Tell me about yourself and why you want to become a Full-Stack Developer.",
        "What interests you about building both frontend and backend applications?",
        "What is the difference between frontend and backend development?",
        "Which programming languages and frameworks have you learned?",
        "What skills should a Full-Stack Developer have?",
        "How do you approach learning a new technology?",
        "How do you manage your time when working on a project?",
        "Describe a technical problem you solved.",
        "How do you respond when your code does not work as expected?",
        "What are your career goals as a Full-Stack Developer?"
        ],
        Intermediate: [
        "Describe a full-stack project you have developed and your contribution.",
        "How do you prioritize frontend and backend tasks?",
        "Tell me about a challenging bug you fixed across the application stack.",
        "How do you handle feedback during code reviews?",
        "How do you coordinate API changes between frontend and backend?",
        "What would you do if a feature worked locally but failed in production?",
        "How do you balance user experience with backend performance?",
        "Describe a time you learned a new framework to complete a project.",
        "How do you handle changing requirements during development?",
        "How would you investigate a production issue reported by a user?"
        ],
        Advanced: [
        "How would you lead the architecture of a large full-stack application?",
        "How do you balance maintainability, scalability, security, and delivery speed?",
        "How would you guide a team through a serious production incident?",
        "How do you decide whether a feature belongs in the frontend, backend, or a separate service?",
        "How would you reduce technical debt across a full-stack codebase?",
        "How would you establish consistent engineering standards across frontend and backend teams?",
        "How would you mentor developers with different technical strengths?",
        "How would you handle disagreement over a major architectural decision?",
        "Which metrics would you use to measure the quality of a full-stack product?",
        "How would you plan the long-term evolution of a growing web application?"
        ]
    },

    Technical: {
        Beginner: [
        "What are HTML, CSS, and JavaScript used for?",
        "What is the difference between frontend and backend?",
        "What is the DOM in web development?",
        "What is responsive web design?",
        "What is the difference between let, const, and var in JavaScript?",
        "What is a REST API?",
        "What is the difference between GET and POST requests?",
        "What is a database, and why does an application need one?",
        "What is the difference between SQL and NoSQL databases?",
        "What is Git, and how does it help developers?"
        ],
        Intermediate: [
        "Explain the difference between client-side and server-side rendering.",
        "How does React manage component state and props?",
        "What are promises and async/await in JavaScript?",
        "How does middleware work in an Express.js application?",
        "How would you implement authentication and authorization in a web application?",
        "What is the difference between cookies, localStorage, and sessionStorage?",
        "How do database indexes improve query performance?",
        "How do you validate user input on both the frontend and backend?",
        "How would you handle API errors and loading states in the frontend?",
        "What are unit tests, integration tests, and end-to-end tests?"
        ],
        Advanced: [
        "How would you design a scalable full-stack architecture for a high-traffic application?",
        "How would you prevent cross-site scripting, SQL injection, and cross-site request forgery?",
        "How would you implement secure session management and token refresh?",
        "How would you optimize a React application with slow rendering and large bundles?",
        "How would you diagnose high latency across the frontend, API, and database?",
        "What are the trade-offs between a monolith and microservices for a full-stack product?",
        "How would you implement caching while maintaining data consistency?",
        "How would you design backward-compatible API and database migrations?",
        "How would you implement observability across browser, backend, and database layers?",
        "How would you design reliable file uploads and background processing in a web application?"
        ]
    },

    "Project-Based": {
        Beginner: [
        "Describe a full-stack project you built and the problem it solves.",
        "What was your role in developing the project?",
        "Which frontend and backend technologies did you use?",
        "How did you organize your project folders and files?",
        "How did the frontend communicate with the backend?",
        "Which database did you use, and why?",
        "How did you validate user input?",
        "How did you test the main features?",
        "What was the biggest challenge during development?",
        "What would you improve if you rebuilt the project?"
        ],
        Intermediate: [
        "Walk me through your application's architecture from browser to database.",
        "Why did you choose your technology stack?",
        "How did you design your database schema and relationships?",
        "How did you implement authentication and protect private routes?",
        "How did you handle API failures and unexpected server responses?",
        "How did you manage environment variables and secrets?",
        "How did you test frontend components and backend endpoints?",
        "How did you identify and resolve a performance bottleneck?",
        "How did you deploy the frontend and backend?",
        "How did you handle changes to API contracts during development?"
        ],
        Advanced: [
        "How would you redesign your project to support ten times more users?",
        "How would you separate tightly coupled frontend and backend components?",
        "How would you make the application resilient to database and API failures?",
        "How would you implement a zero-downtime deployment strategy?",
        "How would you improve security across authentication, APIs, and database access?",
        "How would you investigate a performance issue that appears only in production?",
        "How would you introduce caching without serving stale or unauthorized data?",
        "How would you migrate the database schema without disrupting existing users?",
        "How would you implement monitoring, logging, and error tracking across the stack?",
        "What would you change before making the project production-ready for multiple teams?"
        ]
    }
    },

  "Flutter Developer": {
    HR: {
      Beginner: [
        "Tell me about yourself and why you want to become a Flutter Developer.",
        "What interests you about cross-platform mobile app development?",
        "What is Flutter, and why would you choose it?",
        "Which programming languages have you used for mobile development?",
        "What skills should a Flutter Developer have?",
        "How do you approach learning a new framework?",
        "How do you manage your time when building an application?",
        "Describe a technical problem you solved.",
        "How do you respond when your application behaves unexpectedly?",
        "What are your career goals as a Flutter Developer?"
      ],
      Intermediate: [
        "Describe a Flutter application you have built and your contribution.",
        "How do you prioritize UI improvements and functional requirements?",
        "Tell me about a difficult bug you fixed in a mobile application.",
        "How do you handle feedback during code reviews?",
        "How do you collaborate with backend developers and designers?",
        "What would you do if an application worked on Android but failed on iOS?",
        "How do you balance app performance with development speed?",
        "Describe a time you learned a new Flutter package or API quickly.",
        "How do you handle changing requirements during app development?",
        "What would you do if a release introduced a serious user-facing issue?"
      ],
      Advanced: [
        "How would you lead the architecture of a large Flutter application?",
        "How do you balance maintainability, performance, accessibility, and delivery speed?",
        "How would you guide a team through a critical production app issue?",
        "How would you decide whether to build a feature natively or with Flutter?",
        "How would you reduce technical debt in a mature Flutter codebase?",
        "How would you establish coding and testing standards across a mobile team?",
        "How would you mentor developers with different levels of Flutter experience?",
        "How would you handle disagreement over state management or architecture?",
        "Which metrics would you use to measure mobile application quality?",
        "How would you plan the long-term evolution of a multi-platform Flutter product?"
      ]
    },

    Technical: {
      Beginner: [
        "What is Flutter, and how does it differ from native app development?",
        "What is Dart, and why does Flutter use it?",
        "What is the difference between StatelessWidget and StatefulWidget?",
        "What is a widget in Flutter?",
        "What is the purpose of the build() method?",
        "What is the difference between hot reload and hot restart?",
        "How do Row, Column, and Stack arrange widgets?",
        "What is the purpose of Scaffold and MaterialApp?",
        "How does navigation between screens work in Flutter?",
        "What is pubspec.yaml used for?"
      ],
      Intermediate: [
        "What is state management, and when might you use Provider or Riverpod?",
        "Explain the Flutter widget, element, and render object trees.",
        "What is the difference between Future and Stream in Dart?",
        "How do async and await work in Dart?",
        "How would you call a REST API from a Flutter application?",
        "How do you manage forms and validate user input in Flutter?",
        "What is the difference between keys and widget types in Flutter?",
        "How would you persist simple data locally on a device?",
        "How do you write unit tests and widget tests in Flutter?",
        "How do you handle loading, empty, and error states in an application?"
      ],
      Advanced: [
        "How would you structure a large Flutter application using clean architecture?",
        "How would you investigate and reduce excessive widget rebuilds?",
        "How do isolates work in Dart, and when should you use them?",
        "How would you implement reliable offline-first data synchronization?",
        "How would you securely store tokens and other sensitive information on a device?",
        "How would you diagnose jank and missed frames in a Flutter application?",
        "How would you design dependency injection and testing boundaries in a large app?",
        "How would you manage deep links and navigation across a complex application?",
        "How would you implement crash reporting and performance monitoring?",
        "How would you manage platform-specific functionality while preserving shared code?"
      ]
    },

    "Project-Based": {
      Beginner: [
        "Describe a Flutter project you built and the problem it solves.",
        "What was your role in developing the application?",
        "Why did you choose Flutter for the project?",
        "How did you organize your Dart files and widgets?",
        "How did you design the application's screens?",
        "How did you navigate between screens?",
        "Did your application use an API or local data? Explain how.",
        "How did you test the application on a device or emulator?",
        "What was the biggest challenge you faced?",
        "What would you improve if you rebuilt the project?"
      ],
      Intermediate: [
        "Walk me through your Flutter application's architecture.",
        "Why did you choose your state management approach?",
        "How did you connect your application to backend APIs?",
        "How did you handle API errors and network interruptions?",
        "How did you manage application state across multiple screens?",
        "How did you store and retrieve data locally?",
        "How did you test widgets and application logic?",
        "How did you identify and fix a performance issue?",
        "How did you build and release your application for testing?",
        "How did you manage configuration and environment-specific settings?"
      ],
      Advanced: [
        "How would you redesign your app to support a much larger user base?",
        "How would you refactor tightly coupled widgets and business logic?",
        "How would you implement offline functionality with conflict resolution?",
        "How would you reduce startup time and application bundle size?",
        "How would you protect sensitive data and secure communication with APIs?",
        "How would you investigate crashes occurring only on certain devices?",
        "How would you implement continuous integration and automated mobile releases?",
        "How would you introduce backward-compatible API changes in a released app?",
        "How would you monitor crash rates, latency, and user-facing performance?",
        "What changes would you make before releasing your app to a broad public audience?"
      ]
    }
  },


};




const questions =
    sessionQuestions.length > 0
        ? sessionQuestions
        : roleQuestionBank[selectedRole]?.[interviewMode]?.[difficulty] ||
        questionBank[interviewMode]?.[difficulty] ||
        questionBank.HR.Beginner;


const question = questions[questionIndex];


    
const calculateSpeakingFeedback = (text, duration) => {
if (
    !text?.trim() ||
    !Number.isFinite(duration) ||
    duration < 1
) {
        setSpeakingFeedback(
            "Speaking pace will be available after recording."
        );
        return;
    }

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const durationMinutes = duration / 60;
    const wordsPerMinute = Math.round(wordCount / durationMinutes);
    setSpeakingPace(wordsPerMinute);

    if (wordsPerMinute < 100) {
        setSpeakingFeedback(
            `Speaking pace: ${wordsPerMinute} words/min. Try speaking a little more steadily.`
        );
    } else if (wordsPerMinute <= 160) {
        setSpeakingFeedback(
            `Speaking pace: ${wordsPerMinute} words/min. Your pace is within a typical conversational range.`
        );
    } else {
        setSpeakingFeedback(
            `Speaking pace: ${wordsPerMinute} words/min. Try slowing down and pausing between key points.`
        );
    }
};

    /*
     * CAMERA
     */
    const startCamera = async () => {
        try {
            setCameraError("");

            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraError(
                    "Camera access is not supported by this browser."
                );
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                },
                audio: false,
            });

            cameraStreamRef.current = stream;
            setCameraActive(true);
        } catch (error) {
            console.error("Camera error:", error);

            setCameraActive(false);

            setCameraError(
                "Unable to access your camera. Please check browser permission."
            );
        }
    };

    const stopCamera = () => {
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach((track) => {
                track.stop();
            });

            cameraStreamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
    };

    const handleCameraToggle = async () => {
        if (cameraActive) {
            stopCamera();
        } else {
            await startCamera();
        }
    };

    /*
     * FIND MICROPHONE
     */
    const getPreferredMicrophone = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            const audioInputs = devices.filter(
                (device) => device.kind === "audioinput"
            );

            if (audioInputs.length === 0) {
                return null;
            }

            const preferredDevice = audioInputs.find((device) => {
                const label = (device.label || "").toLowerCase();

                return (
                    label.includes("microphone array") ||
                    label.includes("intel") ||
                    label.includes("smart sound")
                );
            });

            return preferredDevice || audioInputs[0];
        } catch (error) {
            console.error("Could not enumerate microphones:", error);
            return null;
        }
    };

    /*
     * MICROPHONE
     */
    const startMicrophone = async () => {
        try {
            setMicrophoneError("");

            if (!navigator.mediaDevices?.getUserMedia) {
                setMicrophoneError(
                    "Microphone access is not supported by this browser."
                );
                return null;
            }

            const permissionStream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false,
                });

            permissionStream.getTracks().forEach((track) => track.stop());

            const preferredDevice = await getPreferredMicrophone();

            let stream;

            if (preferredDevice?.deviceId) {
                console.log(
                    "Using microphone:",
                    preferredDevice.label || preferredDevice.deviceId
                );

                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: {
                            exact: preferredDevice.deviceId,
                        },
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                    video: false,
                });
            } else {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                    video: false,
                });
            }

            const audioTrack = stream.getAudioTracks()[0];

            if (audioTrack) {
                const settings = audioTrack.getSettings();

                console.log("Microphone track settings:", settings);

                setSelectedMicrophone(
                    preferredDevice?.label ||
                        settings.deviceId ||
                        "Default microphone"
                );
            }

            microphoneStreamRef.current = stream;
            setMicrophoneActive(true);

            return stream;
        } catch (error) {
            console.error("Microphone error:", error);

            setMicrophoneActive(false);

            setMicrophoneError(
                "Unable to access your microphone. Please check browser permission."
            );

            return null;
        }
    };

    const stopMicrophone = () => {
        if (microphoneStreamRef.current) {
            microphoneStreamRef.current.getTracks().forEach((track) => {
                track.stop();
            });

            microphoneStreamRef.current = null;
        }

        if (recordingStreamRef.current) {
            recordingStreamRef.current
                .getTracks()
                .forEach((track) => track.stop());

            recordingStreamRef.current = null;
        }

        setMicrophoneActive(false);
    };

    const handleMicrophoneToggle = async () => {
        if (microphoneActive) {
            if (isRecording) {
                stopRecording();
            }

            stopMicrophone();
        } else {
            await startMicrophone();
        }
    };

    /*
     * RECORDING TIMER
     */
    const startRecordingTimer = () => {
        recordingStartTimeRef.current = Date.now();
        setRecordingSeconds(0);

        recordingTimerRef.current = setInterval(() => {
            setRecordingSeconds((previous) => previous + 1);
        }, 1000);
    };

    const stopRecordingTimer = () => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
    };

    const formatRecordingTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };

    /*
     * AUDIO PLAYBACK
     */
    useEffect(() => {
        if (!recordedAudioUrl || !audioRef.current) {
            return;
        }

        const audio = audioRef.current;

        audio.src = recordedAudioUrl;
        audio.load();

        console.log("Audio player loaded:", recordedAudioUrl);
    }, [recordedAudioUrl]);

    /*
     * TRANSCRIBE AUDIO
     */
    const transcribeRecordedAudio = async (audioBlob) => {
        try {
            setIsTranscribing(true);
            setTranscriptionError("");
            setTranscript("");

            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError || !session?.access_token) {
                throw new Error(
                    "Your login session could not be found. Please log in again."
                );
            }

            const formData = new FormData();

            formData.append(
                "audio",
                audioBlob,
                "interview-answer.webm"
            );

            console.log("Sending audio for transcription:", {
                size: audioBlob.size,
                type: audioBlob.type,
            });

            const response = await fetch(
                "http://localhost:5000/api/speech-to-text/transcribe",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: formData,
                }
            );

            const result = await response.json();

            console.log("Transcription response:", result);

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Speech-to-text failed."
                );
            }

            if (!result.transcript) {
                throw new Error(
                    "The server did not return a transcript."
                );
            }

            setTranscript(result.transcript);
            setAnswer(result.transcript);

            return result.transcript;
        } catch (error) {
            console.error("Transcription error:", error);

            setTranscriptionError(
                error.message ||
                    "Unable to convert your speech into text."
            );

            return null;
        } finally {
            setIsTranscribing(false);
        }
    };

    /*
     * START RECORDING
     */
    const startRecording = async () => {
        try {
            setRecordingError("");
            setTranscriptionError("");
            setTranscript("");
            setRecordingSize(0);

            if (recordingStreamRef.current) {
                recordingStreamRef.current
                    .getTracks()
                    .forEach((track) => track.stop());

                recordingStreamRef.current = null;
            }

            const stream = await startMicrophone();

            if (!stream) {
                setRecordingError(
                    "Microphone access is required before recording."
                );
                return;
            }

            const audioTrack = stream.getAudioTracks()[0];

            if (!audioTrack) {
                setRecordingError(
                    "No microphone audio track was detected."
                );
                return;
            }

            console.log("Recording microphone track:", {
                label: audioTrack.label,
                enabled: audioTrack.enabled,
                readyState: audioTrack.readyState,
                settings: audioTrack.getSettings(),
            });

            if (audioTrack.readyState !== "live") {
                setRecordingError(
                    "The microphone is not currently active. Please try again."
                );
                return;
            }

            if (!window.MediaRecorder) {
                setRecordingError(
                    "Audio recording is not supported by this browser."
                );
                return;
            }

            const supportedTypes = [
                "audio/webm;codecs=opus",
                "audio/webm",
                "audio/ogg;codecs=opus",
            ];

            const mimeType = supportedTypes.find((type) =>
                MediaRecorder.isTypeSupported(type)
            );

            if (!mimeType) {
                setRecordingError(
                    "This browser does not support a compatible audio recording format."
                );
                return;
            }

            console.log("Selected recording format:", mimeType);

            recordingStreamRef.current = stream;

            const recorder = new MediaRecorder(stream, {
                mimeType,
            });

            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                console.log(
                    "Audio chunk received:",
                    event.data.size,
                    "bytes"
                );

                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
    console.log("RECORDER STOP HANDLER EXECUTED");

    console.log(
        "Total audio chunks:",
        audioChunksRef.current.length
    );

    if (audioChunksRef.current.length === 0) {
        setRecordingError(
            "No audio data was captured. Please check your microphone."
        );
        return;
    }

                const audioBlob = new Blob(audioChunksRef.current, {
                    type: mimeType,
                });

                console.log("Final audio Blob:", {
                    size: audioBlob.size,
                    type: audioBlob.type,
                });

                if (audioBlob.size === 0) {
                    setRecordingError(
                        "The recording is empty. Please try recording again."
                    );
                    return;
                }

                const audioUrl = URL.createObjectURL(audioBlob);

                setRecordedAudio(audioBlob);
                setRecordingSize(audioBlob.size);
                setRecordedAudioUrl(audioUrl);

                console.log("Audio URL created:", audioUrl);

                setTimeout(() => {
                    if (recordingStreamRef.current === stream) {
                        stream.getTracks().forEach((track) => {
                            track.stop();
                        });

                        recordingStreamRef.current = null;
                    }
                }, 500);

                /*
                 * Send the completed recording to the server.
                 */
              const finalTranscript = await transcribeRecordedAudio(audioBlob);

const recordingDuration = recordingStartTimeRef.current
    ? (Date.now() - recordingStartTimeRef.current) / 1000
    : recordingSeconds;

console.log("Speaking pace debug:", {
    transcript: finalTranscript,
    recordingDuration,
});

calculateSpeakingFeedback(finalTranscript, recordingDuration);
};
         

            recorder.onerror = (event) => {
                console.error("MediaRecorder error:", event);

                setRecordingError(
                    "Something went wrong while recording your answer."
                );

                setIsRecording(false);
                stopRecordingTimer();
            };

            mediaRecorderRef.current = recorder;

            recorder.start(250);

            setIsRecording(true);
            startRecordingTimer();

            console.log("Recording started.");
        } catch (error) {
            console.error("Could not start recording:", error);

            setIsRecording(false);
            stopRecordingTimer();

            setRecordingError(
                "Could not start audio recording. Please try again."
            );
        }
    };

    /*
     * STOP RECORDING
     */
    const stopRecording = () => {
        const recorder = mediaRecorderRef.current;

        if (!recorder) {
            return;
        }

        if (recorder.state === "recording") {
            console.log("Stopping recording...");
            recorder.stop();
        }

        setIsRecording(false);
        stopRecordingTimer();
    };

    /*
     * START INTERVIEW
     */
    const handleStartInterview = async () => {
        try {
            setSessionError("");
setSessionId(null);
setSessionQuestions([]);
setQuestionIndex(0);
setAnswer("");
setTranscript("");
setSubmitted(false);
setEvaluation(null);
setEvaluationError("");
setRecordingError("");
setTranscriptionError("");
setSpeakingPace(null);
setSpeakingFeedback("");
            
const availableQuestions =
    roleQuestionBank[selectedRole]?.[interviewMode]?.[difficulty] ||
    questionBank[interviewMode]?.[difficulty] ||
    questionBank.HR.Beginner;


const selectedQuestions = [...availableQuestions]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
    console.log("Interview questions selected:", selectedQuestions.length, selectedQuestions);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw userError;
            }

            if (!user) {
                throw new Error(
                    "You must be logged in to start an interview."
                );
            }

            const { data: session, error: sessionInsertError } =
                await supabase
                    .from("interview_sessions")
                    .insert({
                        user_id: user.id,
                        interview_type: interviewMode,
                        role: selectedRole,
                        difficulty: difficulty,
                        total_questions: selectedQuestions.length,
                        completed_questions: 0,
                    })
                    .select()
                    .single();

            if (sessionInsertError) {
                throw sessionInsertError;
            }

            setSessionId(session.id);
            setSessionQuestions(selectedQuestions);
            setQuestionIndex(0);
            setInterviewStarted(true);
            await startCamera();
            await startMicrophone();

            console.log("Interview session created:", session.id);
        } catch (error) {
            console.error("Could not start interview:", error);

            setSessionError(
                error?.message ||
                    "Unable to start the interview. Please try again."
            );
        }
    };

    /*
     * SUBMIT
     */const handleSubmitAnswer = async () => {
    if (isSubmitting || submitted || isEvaluating || isTranscribing) {
        return;
    }

    setIsSubmitting(true);

    try {
        setRecordingError("");

        if (!recordedAudio && !answer.trim()) {
            setRecordingError(
                "Please record your answer or type an answer before submitting."
            );
            return;
        }

        if (!sessionId) {
            setRecordingError(
                "Interview session was not created. Please restart the interview."
            );
            return;
        }

        if (isRecording) {
            stopRecording();
        }

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            throw userError;
        }

        if (!user) {
            throw new Error(
                "You must be logged in to submit your answer."
            );
        }

        const answerText = transcript?.trim() || answer.trim();

        if (!answerText) {
            throw new Error(
                "No transcript or answer text is available."
            );
        }

        const { data: savedAnswer, error: answerError } =
            await supabase
                .from("interview_answers")
                .insert({
                    session_id: sessionId,
                    question: question,
                    answer_text: answerText,
                    question_number: questionIndex + 1,
                    answer_duration_seconds: recordingSeconds,
                })
                .select()
                .single();

        if (answerError) {
            throw answerError;
        }

        console.log(
            "Interview answer saved successfully:",
            savedAnswer
        );

        
setIsEvaluating(true);
setEvaluationError("");

const {
    data: { session: authSession },
    error: authSessionError,
} = await supabase.auth.getSession();

if (authSessionError || !authSession?.access_token) {
    throw new Error("Your login session could not be found. Please log in again.");
}

const evaluationResponse = await fetch(
    "http://localhost:5000/api/interview-evaluation/evaluate",
    {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authSession.access_token}`,
    },
    body: JSON.stringify({
        question,
        answer: answerText,
    }),
    }
);

const evaluationResult = await evaluationResponse.json();

if (
    !evaluationResponse.ok ||
    !evaluationResult.success ||
    !evaluationResult.evaluation
) {
    throw new Error(
        evaluationResult.message || "Unable to evaluate your interview answer."
    );
}

setEvaluation(evaluationResult.evaluation);

const evaluationData = evaluationResult.evaluation;

const { error: evaluationSaveError } = await supabase
    .from("interview_evaluations")
    .insert({
    answer_id: savedAnswer.id,
    overall_score: evaluationData.overall_score,
    relevance_score: evaluationData.relevance_score,
    technical_score: evaluationData.technical_score,
    clarity_score: evaluationData.clarity_score,
    completeness_score: evaluationData.completeness_score,
    strengths: evaluationData.strengths,
    improvements: evaluationData.improvements,
    improved_answer: evaluationData.improved_answer,
    speaking_pace: speakingPace,
    });

if (evaluationSaveError) {
    throw evaluationSaveError;
}

setIsEvaluating(false);



        const { error: sessionUpdateError } =
            await supabase
                .from("interview_sessions")
                .update({
                    completed_questions: questionIndex + 1,
                })
                .eq("id", sessionId)
                .eq("user_id", user.id);

        if (sessionUpdateError) {
            throw sessionUpdateError;
        }
        setIsSubmitting(false);
        setSubmitted(true);
    } catch (error) {
        
        console.error(
            "Interview answer submission error:",
            error
        );

        setIsEvaluating(false);
setEvaluationError(
    error?.message || "Unable to evaluate your interview answer."
);

        setRecordingError(
            error?.message ||
                "Unable to save your interview answer."
        );
    }
};



const handleNextQuestion = () => {
    console.log("Next Question clicked:", {
    isSubmitting,
    isEvaluating,
    isTranscribing,
    isRecording,
    submitted,
    questionIndex,
    totalQuestions: questions.length,
});
    // Prevent navigation while an answer is being saved or evaluated.
    if (isSubmitting || isEvaluating || isTranscribing || isRecording) {
        return;
    }

    // Do not advance until the current answer has been submitted.
    if (!submitted) {
        setRecordingError(
            "Please submit your answer before moving to the next question."
        );
        return;
    }

    // Finish only after the final question has been submitted.
    if (questionIndex >= questions.length - 1) {
        setInterviewStarted(false);
        return;
    }

    if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
    }

    // Move forward by exactly one question.
    setQuestionIndex((prev) => prev + 1);

    // Clear the previous question's state.
    setAnswer("");
    setTranscript("");
    setSubmitted(false);
    setEvaluation(null);
    setEvaluationError("");
    setRecordingSeconds(0);
    setRecordingError("");
    setTranscriptionError("");
    setRecordedAudioUrl("");
    setRecordedAudio(null);
    setRecordingSize(0);
    setSpeakingPace(null);
    setSpeakingFeedback("");
    setSessionError("");

    audioChunksRef.current = [];
    mediaRecorderRef.current = null;
};

    /*
     * TRY AGAIN
     */
    const handleTryAgain = () => {
        setAnswer("");
    setSubmitted(false);
    setIsSubmitting(false);

    setEvaluation(null);
    setEvaluationError("");
    setIsEvaluating(false);

        if (recordedAudioUrl) {
            URL.revokeObjectURL(recordedAudioUrl);
        }

        setAnswer("");
        setSubmitted(false);
        setRecordingSeconds(0);
        setRecordingError("");
        setTranscriptionError("");
        setTranscript("");
        setRecordedAudioUrl("");
        setRecordedAudio(null);
        setRecordingSize(0);
        setIsTranscribing(false);
        setIsSubmitting(false);
        setSessionError("");

        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
    };

    /*
     * CLEANUP WHEN LEAVING PAGE
     */
    useEffect(() => {
        return () => {
            stopRecordingTimer();

            if (mediaRecorderRef.current) {
                try {
                    if (mediaRecorderRef.current.state !== "inactive") {
                        mediaRecorderRef.current.stop();
                    }
                } catch (error) {
                    console.error("Recorder cleanup error:", error);
                }
            }

            if (cameraStreamRef.current) {
                cameraStreamRef.current.getTracks().forEach((track) => {
                    track.stop();
                });
            }

            if (microphoneStreamRef.current) {
                microphoneStreamRef.current.getTracks().forEach((track) => {
                    track.stop();
                });
            }

            if (recordingStreamRef.current) {
                recordingStreamRef.current.getTracks().forEach((track) => {
                    track.stop();
                });
            }
        };
    }, []);

    /*
     * ATTACH CAMERA
     */
    useEffect(() => {
        if (
            cameraActive &&
            videoRef.current &&
            cameraStreamRef.current
        ) {
            videoRef.current.srcObject = cameraStreamRef.current;

            videoRef.current.play().catch((error) => {
                console.error("Video playback error:", error);
            });
        }
    }, [cameraActive]);


// Initialize AI Face Detector
useEffect(() => {
    let cancelled = false;

    const initializeFaceDetector = async () => {
        try {
            
    const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );

            const detector = await FaceDetector.createFromOptions(
                vision,
                {
                    baseOptions: {
                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
                        delegate: "CPU",
                    },
                    runningMode: "VIDEO",
                }
            );

            if (cancelled) {
                detector.close();
                return;
            }

            faceDetectorRef.current = detector;
            console.log("AI Face Detector initialized successfully.");
        } catch (error) {
            console.error("Face detector initialization error:", error);
            setFaceFeedback(
                "Face detection could not start. Check your internet connection and try again."
            );
        }
    };

    initializeFaceDetector();

    return () => {
        cancelled = true;
        faceDetectorRef.current?.close();
        faceDetectorRef.current = null;
    };
}, []);


// Live Face Detection
useEffect(() => {
    let animationId;
    let lastDetectionTime = 0;

    const detectFace = (timestamp) => {
        const video = videoRef.current;
        const detector = faceDetectorRef.current;

        if (
            cameraActive &&
            video &&
            detector &&
            video.readyState >= 2 &&
            timestamp - lastDetectionTime >= 200
        ) {
            lastDetectionTime = timestamp;

            try {
                const results = detector.detectForVideo(
                    video,
                    timestamp
                );

                if (!results.detections.length) {
                    setFaceFeedback(
                        "No face detected. Check your camera position and lighting."
                    );
                } else {
                    const box = results.detections[0].boundingBox;

                    const centerX = box.originX + box.width / 2;
                    const centerY = box.originY + box.height / 2;

                    const frameWidth = video.videoWidth;
                    const frameHeight = video.videoHeight;

                    const horizontalCenter = frameWidth / 2;
                    const verticalCenter = frameHeight / 2;

                    const horizontallyCentered =
                        Math.abs(centerX - horizontalCenter) <
                        frameWidth * 0.15;

                    const verticallyPositioned =
                        centerY > frameHeight * 0.2 &&
                        centerY < frameHeight * 0.75;


const faceWidthRatio = box.width / frameWidth;
const faceHeightRatio = box.height / frameHeight;

if (faceWidthRatio > 0.55 || faceHeightRatio > 0.75) {
    setFaceFeedback(
        "Your face appears too close. Move slightly farther from the camera."
    );
} else if (faceWidthRatio < 0.15 || faceHeightRatio < 0.2) {
    setFaceFeedback(
        "Your face appears too far away. Move a little closer to the camera."
    );
} else if (!horizontallyCentered || !verticallyPositioned) {
    setFaceFeedback(
        "Face detected, but your framing is off-center. Adjust your position."
    );
} else {
    setFaceFeedback(
        "Great framing! Your face is visible, centered, and comfortably positioned."
    );
}

                }
            } catch (error) {
                console.error("Live face detection error:", error);
            }
        }

        if (cameraActive) {
            animationId = requestAnimationFrame(detectFace);
        }
    };

    if (cameraActive) {
        animationId = requestAnimationFrame(detectFace);
    } else {
        setFaceFeedback(
            "Turn on your camera to begin face detection."
        );
    }

    return () => {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    };
}, [cameraActive]);


    return (
        <div className="interview-studio-page">
            <div className="interview-studio-header">
                <div>
                    <div className="interview-title-row">
                        <Brain size={30} />
                        <h1>Interview Studio</h1>
                    </div>

                    <p>
                        Practice interviews with an AI interviewer and improve
                        your answers step by step.
                    </p>
                </div>

                <div className="interview-mode">
                    <span className="interview-mode-dot"></span>
                    AI Interview
                </div>
            </div>

            {!interviewStarted ? (
                <div className="interview-start-card">
                    <div className="interview-start-icon">
                        <Brain size={42} />
                    </div>

                    <h2>Ready for your interview?</h2>
                    
{/* Interview Mode Selection */}

{/* Career Role Selection */}
<div style={{ marginBottom: "22px" }}>
    <h3 style={{ marginBottom: "12px" }}>
        Choose Career Role
    </h3>

    <select
        value={selectedRole}
        onChange={(event) => setSelectedRole(event.target.value)}
        style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#334155",
            fontSize: "15px",
            cursor: "pointer",
        }}
    >
        <optgroup label="AI-Powered Development">
            <option value="AI Full-Stack Developer">
                AI Full-Stack Developer
            </option>
            <option value="AI Software Developer">
                AI Software Developer
            </option>
            <option value="AI Application Developer">
                AI Application Developer
            </option>
            <option value="AI/ML Engineer">
                AI/ML Engineer
            </option>
            <option value="Generative AI Engineer">
                Generative AI Engineer
            </option>
            <option value="LLM Application Developer">
                LLM Application Developer
            </option>
        </optgroup>

        <optgroup label="Software & Web Development">
            <option value="Full-Stack Developer">
                Full-Stack Developer
            </option>
            <option value="Frontend Developer">
                Frontend Developer
            </option>
            <option value="Backend Developer">
                Backend Developer
            </option>
            
            <option value="Python Developer">
                Python Developer
            </option>

            <option value="Software Engineer">
                Software Engineer
            </option>
            <option value="Flutter Developer">
                Flutter Developer
            </option>
        </optgroup>

        <optgroup label="Data & Infrastructure">
            <option value="Data Scientist">Data Scientist</option>
            <option value="Data Analyst">Data Analyst</option>
            <option value="Data Engineer">Data Engineer</option>
            <option value="Cloud/DevOps Engineer">
                Cloud/DevOps Engineer
            </option>
            <option value="Cybersecurity Engineer">
                Cybersecurity Engineer
            </option>
        </optgroup>
    </select>
</div>

<div style={{ margin: "24px 0", textAlign: "left" }}>
    <h3 style={{ marginBottom: "12px" }}>Choose Interview Mode</h3>

    <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "10px",
    }}>
        {["HR", "Technical", "Project-Based"].map((mode) => (
            <button
                key={mode}
                type="button"
                onClick={() => setInterviewMode(mode)}
                style={{
                    padding: "14px 10px",
                    borderRadius: "10px",
                    border: interviewMode === mode
                        ? "2px solid #2563eb"
                        : "1px solid #cbd5e1",
                    background: interviewMode === mode
                        ? "#eff6ff"
                        : "#ffffff",
                    color: interviewMode === mode
                        ? "#1d4ed8"
                        : "#334155",
                    fontWeight: interviewMode === mode ? "700" : "500",
                    cursor: "pointer",
                }}
            >
                {mode}
            </button>
            
        ))}
    </div>

    <h3 style={{ margin: "22px 0 12px" }}>Choose Difficulty</h3>

    <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "10px",
    }}>
        {["Beginner", "Intermediate", "Advanced"].map((level) => (
            <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                style={{
                    padding: "14px 10px",
                    borderRadius: "10px",
                    border: difficulty === level
                        ? "2px solid #2563eb"
                        : "1px solid #cbd5e1",
                    background: difficulty === level
                        ? "#eff6ff"
                        : "#ffffff",
                    color: difficulty === level
                        ? "#1d4ed8"
                        : "#334155",
                    fontWeight: difficulty === level ? "700" : "500",
                    cursor: "pointer",
                }}
            >
                {level}
            </button>
        ))}
    </div>
</div>


                    <p>
                        The AI interviewer will ask you questions based on your
                        profile, skills, projects and target role.
                    </p>

                    <div className="interview-features">
                        <div>
                            <Camera size={20} />
                            <span>Camera</span>
                        </div>

                        <div>
                            <Mic size={20} />
                            <span>Microphone</span>
                        </div>

                        <div>
                            <Brain size={20} />
                            <span>AI Feedback</span>
                        </div>
                    </div>

                    <button
                        className="interview-start-button"
                        onClick={handleStartInterview}
                        disabled={isSubmitting}
                    >
                        <Play size={18} />
                        Start Interview
                    </button>

                    {sessionError && (
                        <div
                            style={{
                                marginTop: "12px",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                background: "#fef2f2",
                                color: "#b91c1c",
                                fontSize: "13px",
                            }}
                        >
                            {sessionError}
                        </div>
                    )}
                </div>
            ) : (
                <div className="interview-workspace">
                    <div className="interview-video-card">
                        <div className="camera-placeholder">
                            {cameraActive ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: "14px",
                                        transform: "scaleX(-1)",
                                    }}
                                />
                            ) : (
                                <>
                                    <Camera size={48} />
                                    <span>Camera Preview</span>
                                    <small>
                                        {cameraError ||
                                            "Camera is currently off."}
                                    </small>
                                </>
                            )}
                        </div>

                        <div className="camera-controls">
                            <button
                                onClick={handleCameraToggle}
                                title={
                                    cameraActive
                                        ? "Turn camera off"
                                        : "Turn camera on"
                                }
                                style={{
                                    background: cameraActive
                                        ? "#eff6ff"
                                        : "#ffffff",
                                    color: cameraActive
                                        ? "#2563eb"
                                        : "#475569",
                                }}
                            >
                                <Camera size={18} />
                            </button>

                            <button
                                onClick={handleMicrophoneToggle}
                                title={
                                    microphoneActive
                                        ? "Turn microphone off"
                                        : "Turn microphone on"
                                }
                                style={{
                                    background: microphoneActive
                                        ? "#eff6ff"
                                        : "#ffffff",
                                    color: microphoneActive
                                        ? "#2563eb"
                                        : "#475569",
                                }}
                            >
                                <Mic size={18} />
                            </button>
                        </div>

                        {microphoneActive && selectedMicrophone && (
                            <div
                                style={{
                                    marginTop: "8px",
                                    textAlign: "center",
                                    color: "#64748b",
                                    fontSize: "12px",
                                }}
                            >
                                Microphone: {selectedMicrophone}
                            </div>
                        )}

                        {microphoneError && (
                            <div
                                style={{
                                    marginTop: "10px",
                                    textAlign: "center",
                                    color: "#dc2626",
                                    fontSize: "13px",
                                }}
                            >
                                {microphoneError}
                            </div>
                        )}
                    </div>

                    <div className="interview-question-card">
                        
{/* Camera Feedback */}
<div
    style={{
        marginTop: "12px",
        padding: "14px 16px",
        borderRadius: "12px",
        background: cameraActive ? "#f0fdf4" : "#f8fafc",
        border: `1px solid ${cameraActive ? "#bbf7d0" : "#e2e8f0"}`,
    }}
>
    <div
        style={{
            fontWeight: "700",
            fontSize: "14px",
            marginBottom: "6px",
            color: "#0f172a",
        }}
    >
        Camera Feedback
    </div>

    {cameraActive ? (
        <div style={{ fontSize: "13px", color: "#166534", lineHeight: "1.7" }}>
            <div>✓ Camera is active.</div>
            <div>• {faceFeedback}</div>
            
            <div>• Keep your face centered in the preview.</div>
            <div>• Position the camera near eye level.</div>
            <div>• Make sure your face is well lit and clearly visible.</div>
        </div>
    ) : (
        <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
            Turn on your camera to receive camera setup guidance.
        </div>
    )}
</div>

                        <div className="question-header">
                            <span>
    Question {questionIndex + 1} of {questions.length}
</span>

                            <span className="question-type">
                                Introduction
                            </span>
                        </div>

                        <h2>{question}</h2>

                        {!submitted ? (
                            <>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "12px",
                                        marginBottom: "14px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "13px",
                                            color: "#64748b",
                                        }}
                                    >
                                        Record your spoken answer below.
                                    </span>

                                    <span
                                        style={{
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            color: isRecording
                                                ? "#dc2626"
                                                : "#64748b",
                                        }}
                                    >
                                        {isRecording
                                            ? `● Recording ${formatRecordingTime(
                                                recordingSeconds
                                                )}`
                                            : isTranscribing
                                            ? "Transcribing..."
                                            : recordedAudio
                                            ? "Recording ready"
                                            : "Ready to record"}
                                    </span>
                                </div>

                                <textarea
                                    value={answer}
                                    onChange={(event) =>
                                        setAnswer(event.target.value)
                                    }
                                    placeholder="Your speech transcript will appear here after recording..."
                                />
                                {speakingFeedback && (
    <div
        style={{
            marginTop: "10px",
            padding: "12px",
            background: "#eff6ff",
            borderRadius: "8px",
            color: "#1d4ed8",
            fontSize: "14px",
        }}
    >
        {speakingFeedback}
    </div>
)}

                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                        gap: "10px",
                                        marginTop: "16px",
                                    }}
                                >
                                    {!isRecording ? (
                                        <button
                                            type="button"
                                            onClick={startRecording}
                                            disabled={isTranscribing}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                border: "none",
                                                borderRadius: "10px",
                                                padding: "12px 18px",
                                                background: isTranscribing
                                                    ? "#94a3b8"
                                                    : "#dc2626",
                                                color: "#ffffff",
                                                cursor: isTranscribing
                                                    ? "not-allowed"
                                                    : "pointer",
                                                fontWeight: "600",
                                            }}
                                        >
                                            <Circle size={17} />
                                            {isTranscribing
                                                ? "Transcribing..."
                                                : "Start Recording"}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={stopRecording}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                border: "none",
                                                borderRadius: "10px",
                                                padding: "12px 18px",
                                                background: "#0f172a",
                                                color: "#ffffff",
                                                cursor: "pointer",
                                                fontWeight: "600",
                                            }}
                                        >
                                            <Square size={16} />
                                            Stop Recording
                                        </button>
                                    )}

                                    {recordedAudioUrl && (
                                        <audio
                                            ref={audioRef}
                                            controls
                                            preload="auto"
                                            src={recordedAudioUrl}
                                            style={{
                                                height: "42px",
                                                maxWidth: "100%",
                                            }}
                                            onError={(event) => {
                                                console.error(
                                                    "Audio playback error:",
                                                    event
                                                );

                                                setRecordingError(
                                                    "The recording was created, but this browser could not play the audio file."
                                                );
                                            }}
                                            onLoadedMetadata={(event) => {
                                                console.log(
                                                    "Audio duration:",
                                                    event.currentTarget
                                                        .duration
                                                );
                                            }}
                                        />
                                    )}
                                </div>

                                {recordedAudio && (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "4px",
                                            marginTop: "12px",
                                            padding: "10px 12px",
                                            borderRadius: "9px",
                                            background: "#eff6ff",
                                            color: "#2563eb",
                                            fontSize: "13px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            <Volume2 size={16} />
                                            Audio answer recorded
                                            successfully.
                                        </div>

                                        <span
                                            style={{
                                                marginLeft: "24px",
                                                fontSize: "12px",
                                                color: "#64748b",
                                            }}
                                        >
                                            Recording size:{" "}
                                            {(recordingSize / 1024).toFixed(
                                                1
                                            )}{" "}
                                            KB
                                        </span>
                                    </div>
                                )}

                                {isTranscribing && (
                                    <div
                                        style={{
                                            marginTop: "12px",
                                            padding: "12px",
                                            borderRadius: "9px",
                                            background: "#f8fafc",
                                            color: "#475569",
                                            fontSize: "13px",
                                        }}
                                    >
                                        🎙️ Converting your spoken answer into
                                        text...
                                    </div>
                                )}

                                {transcript && (
                                    <div
                                        style={{
                                            marginTop: "12px",
                                            padding: "14px",
                                            borderRadius: "9px",
                                            background: "#f0fdf4",
                                            border: "1px solid #bbf7d0",
                                            color: "#166534",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: "700",
                                                marginBottom: "6px",
                                            }}
                                        >
                                            📝 Transcript
                                        </div>

                                        <div
                                            style={{
                                                lineHeight: "1.6",
                                                fontSize: "14px",
                                            }}
                                        >
                                            {transcript}
                                        </div>
                                    </div>
                                )}

                                {transcriptionError && (
                                    <div
                                        style={{
                                            marginTop: "10px",
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            background: "#fef2f2",
                                            color: "#b91c1c",
                                            fontSize: "13px",
                                        }}
                                    >
                                        Speech-to-text error:{" "}
                                        {transcriptionError}
                                    </div>
                                )}

                                {recordingError && (
                                    <div
                                        style={{
                                            marginTop: "10px",
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            background: "#fef2f2",
                                            color: "#b91c1c",
                                            fontSize: "13px",
                                        }}
                                    >
                                        {recordingError}
                                    </div>
                                )}

                                <button
                                    className="submit-answer-button"
                                    onClick={handleSubmitAnswer}
                                    disabled={
                                        isTranscribing ||
                                        isSubmitting ||
                                        (!recordedAudio && !answer.trim())
                                    }
                                >
                                    <Send size={18} />
                                    {isSubmitting
                                        ? "Saving Answer..."
                                        : "Submit Answer"}
                                </button>
                            </>
                        ) : (
                            <div className="interview-feedback-preview">
                                <div className="feedback-header">
                                    <Brain size={20} />
                                    <h3>Answer Recorded</h3>
                                </div>

                                
<p>
    {isEvaluating
        ? "AI is evaluating your answer. Please wait..."
        : evaluation
        ? "Your AI interview evaluation is complete!"
        : evaluationError
        ? "Your answer was recorded, but AI evaluation failed."
        : "Your answer has been recorded and transcribed."}
</p>

{evaluationError && (
    <p style={{ color: "red", marginTop: "10px" }}>
        {evaluationError}
    </p>
)}


                                {transcript && (
                                    <div
                                        style={{
                                            marginTop: "12px",
                                            padding: "14px",
                                            borderRadius: "9px",
                                            background: "#f8fafc",
                                            lineHeight: "1.6",
                                        }}
                                    >
                                        <strong>Transcript:</strong>
                                        <div style={{ marginTop: "6px" }}>
                                            {transcript}
                                        </div>
                                    </div>
                                )}

                                {recordedAudioUrl && (
                                    <audio
                                        controls
                                        preload="auto"
                                        src={recordedAudioUrl}
                                        style={{
                                            width: "100%",
                                            margin: "12px 0",
                                        }}
                                    />
                                )}

                                
{evaluation && (
    <div
        style={{
            marginTop: "16px",
            padding: "18px",
            borderRadius: "12px",
            background: "#f0f7ff",
            border: "1px solid #bfdbfe",
            color: "#1e293b",
        }}
    >
        <h3 style={{ color: "#1d4ed8", marginTop: 0 }}>
            AI Evaluation Results
        </h3>

        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                gap: "10px",
            }}
        >
            {[
                ["Overall", evaluation.overall_score],
                ["Relevance", evaluation.relevance_score],
                ["Technical", evaluation.technical_score],
                ["Clarity", evaluation.clarity_score],
                ["Completeness", evaluation.completeness_score],
            ].map(([label, score]) => (
                <div
                    key={label}
                    style={{
                        padding: "12px",
                        background: "#ffffff",
                        borderRadius: "8px",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "13px", color: "#64748b" }}>
                        {label}
                    </div>
                    <strong style={{ fontSize: "24px", color: "#2563eb" }}>
                        {score ?? "—"}
                        <span style={{ fontSize: "13px" }}>/100</span>
                    </strong>
                </div>
            ))}
        </div>
            
        {/* Speaking Pace */}
        <div
            style={{
                marginTop: "16px",
                padding: "16px",
                background: "#ffffff",
                border: "1px solid #bfdbfe",
                borderRadius: "10px",
            }}
        >
            <div
                style={{
                    fontSize: "14px",
                    color: "#64748b",
                    marginBottom: "6px",
                }}
            >
                Speaking Pace
            </div>

            <div
                style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#2563eb",
                }}
            >
                {speakingPace !== null
                    ? `${speakingPace} WPM`
                    : "Not available"}
            </div>

            <p style={{ marginBottom: 0, fontSize: "13px", color: "#475569" }}>
                {speakingFeedback ||
                    "Record a spoken answer to calculate your speaking pace."}
            </p>
        </div>

        <h4>Strengths</h4>
        {Array.isArray(evaluation.strengths) ? (
            <ul>
                {evaluation.strengths.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
        ) : (
            <p>{evaluation.strengths || "No strengths provided."}</p>
        )}

        <h4>Areas to Improve</h4>
        {Array.isArray(evaluation.improvements) ? (
            <ul>
                {evaluation.improvements.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
        ) : (
            <p>{evaluation.improvements || "No suggestions provided."}</p>
        )}

        <h4>Suggested Improved Answer</h4>
        <div
            style={{
                padding: "14px",
                background: "#ffffff",
                borderRadius: "8px",
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
            }}
        >
            {evaluation.improved_answer || "No improved answer available."}
        </div>
    </div>
)}


                                
<button
    className="try-again-button"
    onClick={handleTryAgain}
>
    <RotateCcw size={18} />
    Record Again
</button>

<button
    type="button"
    onClick={handleNextQuestion}
    disabled={isEvaluating || isSubmitting}
    style={{
        marginTop: "12px",
        marginLeft: "10px",
        padding: "12px 20px",
        border: "none",
        borderRadius: "8px",
        background: "#2563eb",
        color: "#ffffff",
        fontWeight: "600",
        cursor: "pointer",
    }}
>
    {questionIndex === questions.length - 1
        ? "Finish Interview"
        : "Next Question"}
</button>

                            </div>
                            
                        )}
                    </div>
                </div>
            )}
        </div>
    );
    
}

export default InterviewStudio;