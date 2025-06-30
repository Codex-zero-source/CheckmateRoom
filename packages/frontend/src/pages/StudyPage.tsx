import type { FC } from 'react';
import { useState, useEffect } from 'react';
import './StudyPage.css';

const StudyPage: FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [progress, setProgress] = useState(35);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const categories = [
        { id: 'all', label: 'All Courses', icon: '📚' },
        { id: 'openings', label: 'Openings', icon: '🚀' },
        { id: 'middlegame', label: 'Middlegame', icon: '⚔️' },
        { id: 'endgame', label: 'Endgame', icon: '🏁' },
        { id: 'tactics', label: 'Tactics', icon: '🎯' }
    ];

    const courses = [
        {
            id: 1,
            title: "Chess Fundamentals",
            instructor: "GM Magnus Carlsen",
            duration: "2 hours",
            lessons: 12,
            difficulty: "Beginner",
            category: "all",
            progress: 100,
            rating: 4.9,
            students: 15420,
            thumbnail: "♟️",
            color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        },
        {
            id: 2,
            title: "Advanced Openings",
            instructor: "GM Hikaru Nakamura",
            duration: "4 hours",
            lessons: 18,
            difficulty: "Advanced",
            category: "openings",
            progress: 65,
            rating: 4.8,
            students: 8920,
            thumbnail: "♔",
            color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        },
        {
            id: 3,
            title: "Endgame Mastery",
            instructor: "GM Fabiano Caruana",
            duration: "3 hours",
            lessons: 15,
            difficulty: "Intermediate",
            category: "endgame",
            progress: 0,
            rating: 4.7,
            students: 6780,
            thumbnail: "♕",
            color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        },
        {
            id: 4,
            title: "Tactical Brilliance",
            instructor: "GM Wesley So",
            duration: "2.5 hours",
            lessons: 14,
            difficulty: "Intermediate",
            category: "tactics",
            progress: 45,
            rating: 4.9,
            students: 12340,
            thumbnail: "♖",
            color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
        }
    ];

    const filteredCourses = selectedCategory === 'all' 
        ? courses 
        : courses.filter(course => course.category === selectedCategory);

    return (
        <div className={`study-page ${isVisible ? 'visible' : ''}`}>
            <div className="study-container">
                <div className="study-header">
                    <div className="header-content">
                        <h1 className="page-title">Chess Academy</h1>
                        <p className="page-subtitle">Master the game with lessons from world-class grandmasters</p>
                        
                        <div className="progress-section">
                            <div className="progress-info">
                                <span className="progress-label">Your Learning Progress</span>
                                <span className="progress-percentage">{progress}%</span>
                            </div>
                            <div className="progress-bar-container">
                                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="header-visual">
                        <div className="floating-elements">
                            <div className="floating-piece" style={{ animationDelay: '0s' }}>♔</div>
                            <div className="floating-piece" style={{ animationDelay: '1s' }}>♕</div>
                            <div className="floating-piece" style={{ animationDelay: '2s' }}>♖</div>
                            <div className="floating-piece" style={{ animationDelay: '3s' }}>♗</div>
                        </div>
                    </div>
                </div>

                <div className="category-filter">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(category.id)}
                        >
                            <span className="category-icon">{category.icon}</span>
                            <span className="category-label">{category.label}</span>
                        </button>
                    ))}
                </div>

                <div className="courses-grid">
                    {filteredCourses.map((course, index) => (
                        <div 
                            key={course.id}
                            className="course-card"
                            style={{ 
                                background: course.color,
                                animationDelay: `${index * 0.1}s`
                            }}
                        >
                            <div className="course-header">
                                <div className="course-thumbnail">{course.thumbnail}</div>
                                <div className="course-meta">
                                    <span className="course-difficulty">{course.difficulty}</span>
                                    <div className="course-rating">
                                        <span className="stars">★★★★★</span>
                                        <span className="rating-value">{course.rating}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="course-content">
                                <h3 className="course-title">{course.title}</h3>
                                <p className="course-instructor">by {course.instructor}</p>
                                
                                <div className="course-stats">
                                    <div className="stat">
                                        <span className="stat-icon">⏱️</span>
                                        <span className="stat-value">{course.duration}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-icon">📖</span>
                                        <span className="stat-value">{course.lessons} lessons</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-icon">👥</span>
                                        <span className="stat-value">{course.students.toLocaleString()}</span>
                                    </div>
                                </div>
                                
                                <div className="course-progress">
                                    <div className="progress-info">
                                        <span className="progress-text">
                                            {course.progress === 100 ? 'Completed' : `${course.progress}% Complete`}
                                        </span>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div 
                                            className="progress-bar" 
                                            style={{ width: `${course.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                <button className="course-action">
                                    {course.progress === 100 ? 'Review Course' : 'Continue Learning'}
                                </button>
                            </div>
                            
                            <div className="course-glow"></div>
                        </div>
                    ))}
                </div>

                <div className="coming-soon-section">
                    <div className="coming-soon-card">
                        <h2>More Courses Coming Soon!</h2>
                        <p>We're working on new courses with top grandmasters</p>
                        <div className="upcoming-courses">
                            <div className="upcoming-course">
                                <span className="upcoming-icon">🎓</span>
                                <span className="upcoming-title">Advanced Strategy</span>
                            </div>
                            <div className="upcoming-course">
                                <span className="upcoming-icon">🧠</span>
                                <span className="upcoming-title">Psychological Warfare</span>
                            </div>
                            <div className="upcoming-course">
                                <span className="upcoming-icon">⚡</span>
                                <span className="upcoming-title">Speed Chess Mastery</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudyPage; 