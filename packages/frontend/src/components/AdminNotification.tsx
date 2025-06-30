import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminNotification.css';

interface AdminNotificationProps {
    isVisible: boolean;
    onClose: () => void;
}

const AdminNotification: React.FC<AdminNotificationProps> = ({ isVisible, onClose }) => {
    const navigate = useNavigate();

    const handleGoToAdmin = () => {
        navigate('/admin');
        onClose();
    };

    if (!isVisible) return null;

    return (
        <div className="admin-notification">
            <div className="admin-notification-content">
                <div className="admin-notification-header">
                    <span className="admin-icon">👑</span>
                    <span className="admin-title">Admin Access Detected</span>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="admin-notification-body">
                    <p>Welcome, Administrator! You have access to admin functions.</p>
                    <div className="admin-actions">
                        <button className="admin-btn primary" onClick={handleGoToAdmin}>
                            🎯 Go to Admin Panel
                        </button>
                        <button className="admin-btn secondary" onClick={onClose}>
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNotification; 