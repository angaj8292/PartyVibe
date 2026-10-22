import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import CreateRoomModal from './components/CreateRoomModal';
import TopUpModal from './components/TopUpModal';
import AppSideDrawer from './components/AppSideDrawer';
import ExplorePage from './pages/ExplorePage';
import FollowPage from './pages/FollowPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import RoomPage from './pages/RoomPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const App = () => {
  const location = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isRoomPage = location.pathname.startsWith('/room/');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen bg-vibe-bg text-gray-100 flex flex-col font-sans">
      {/* Top Navigation Bar (Hidden in Room & Auth pages) */}
      {!isRoomPage && !isAuthPage && (
        <Navbar
          onOpenTopUp={() => setIsTopUpOpen(true)}
          onOpenDrawer={() => setIsDrawerOpen(true)}
        />
      )}

      {/* Main Routed Content */}
      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<ExplorePage onOpenCreate={() => setIsCreateOpen(true)} />} />
          <Route path="/follow" element={<FollowPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route
            path="/profile"
            element={
              <ProfilePage
                onOpenTopUp={() => setIsTopUpOpen(true)}
                onOpenDrawer={() => setIsDrawerOpen(true)}
              />
            }
          />
          <Route path="/room/:id" element={<RoomPage onOpenTopUp={() => setIsTopUpOpen(true)} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>

      {/* Mobile-first Bottom Navigation (Hidden in Room & Auth pages) */}
      {!isRoomPage && !isAuthPage && (
        <BottomNav onOpenCreate={() => setIsCreateOpen(true)} />
      )}

      {/* Global Modals & Side Drawer */}
      <AppSideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenTopUp={() => setIsTopUpOpen(true)}
      />

      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
      />
    </div>
  );
};

export default App;
