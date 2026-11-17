import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import QuickCreateModal from '../components/QuickCreateModal';
import TaskDetailModal from '../components/TaskDetailModal';
import GlobalSearchModal from '../components/GlobalSearchModal';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState('task');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Global listener for opening search modal
  useEffect(() => {
    const handleOpenSearch = () => setSearchModalOpen(true);
    window.addEventListener('open-taskflow-search', handleOpenSearch);
    return () => window.removeEventListener('open-taskflow-search', handleOpenSearch);
  }, []);

  const handleOpenCreate = (type = 'task') => {
    setCreateModalType(type);
    setCreateModalOpen(true);
  };

  const handleOpenTask = (taskId) => {
    setSelectedTaskId(taskId);
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenCreateModal={handleOpenCreate}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Navbar
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenCreateModal={handleOpenCreate}
          onOpenSearchModal={() => setSearchModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ onOpenTask: handleOpenTask, onOpenCreate: handleOpenCreate }} />
        </main>
      </div>

      {/* Global Modals */}
      <QuickCreateModal
        isOpen={createModalOpen}
        initialType={createModalType}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(item) => {
          window.dispatchEvent(new CustomEvent('taskflow-data-changed', { detail: item }));
        }}
      />

      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={(task) => {
          window.dispatchEvent(new CustomEvent('taskflow-data-changed', { detail: task }));
        }}
        onTaskDeleted={(taskId) => {
          window.dispatchEvent(new CustomEvent('taskflow-data-changed', { detail: taskId }));
        }}
      />

      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectTask={(taskId) => setSelectedTaskId(taskId)}
      />
    </div>
  );
};

export default MainLayout;
