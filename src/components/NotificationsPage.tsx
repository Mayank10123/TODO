import React from 'react';
import { NotificationsManager } from './NotificationsManager';

interface NotificationsPageProps {
  theme?: 'clean' | 'retro';
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ theme = 'clean' }) => {
  return (
    <div className="max-w-5xl mx-auto p-8">
      <NotificationsManager />
    </div>
  );
};

export default NotificationsPage;