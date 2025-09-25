import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import ProjectSelector from './components/ProjectSelector/ProjectSelector';
import Dashboard from './components/Dashboard/Dashboard';
import InstanceList from './components/InstanceList/InstanceList';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const [selectedProject, setSelectedProject] = useState('');
  const socket = useWebSocket();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {!selectedProject ? (
            <ProjectSelector onProjectSelect={setSelectedProject} />
          ) : (
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    projectId={selectedProject} 
                    socket={socket}
                    onProjectChange={setSelectedProject}
                  />
                } 
              />
              <Route 
                path="/instances" 
                element={
                  <InstanceList 
                    projectId={selectedProject} 
                    socket={socket}
                  />
                } 
              />
            </Routes>
          )}
        </main>
      </div>
    </Router>
  );
}

export default App;