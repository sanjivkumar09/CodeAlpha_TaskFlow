import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectApi } from '../services/api';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    return localStorage.getItem('taskflow_selected_project') || null;
  });
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await projectApi.getAll();
      const list = res.data.projects || [];
      setProjects(list);

      // If no project selected yet or selected project no longer exists, select first
      if (list.length > 0) {
        const exists = list.find((p) => p._id === selectedProjectId);
        if (!exists) {
          setSelectedProjectId(list[0]._id);
          localStorage.setItem('taskflow_selected_project', list[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, selectedProjectId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const selectProject = (id) => {
    setSelectedProjectId(id);
    if (id) {
      localStorage.setItem('taskflow_selected_project', id);
    } else {
      localStorage.removeItem('taskflow_selected_project');
    }
  };

  const currentProject = projects.find((p) => p._id === selectedProjectId) || (projects.length > 0 ? projects[0] : null);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        selectedProjectId,
        currentProject,
        selectProject,
        refreshProjects: fetchProjects,
        loading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
