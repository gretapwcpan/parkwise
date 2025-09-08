import React, { useState, useEffect, useRef } from 'react';
import './DraggablePanel.css';

// Keep track of all minimized panels globally
let minimizedPanels = new Set();
let panelOrder = [];

const DraggablePanel = ({ 
  children, 
  title, 
  defaultPosition, 
  minWidth = 300,
  canMinimize = true,
  className = '',
  startMinimized = true, // Default to minimized
  panelId = Math.random().toString(36).substr(2, 9) // Unique ID for each panel
}) => {
  const [position, setPosition] = useState(
    defaultPosition || { x: window.innerWidth - 400, y: 100 }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(startMinimized);
  const [minimizedPosition, setMinimizedPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const savedPositionRef = useRef(null);
  
  // Initialize minimized position on mount
  useEffect(() => {
    if (startMinimized) {
      // Add to minimized panels set on mount
      minimizedPanels.add(panelId);
      if (!panelOrder.includes(panelId)) {
        panelOrder.push(panelId);
      }
      
      // Calculate initial position in the bottom-right stack
      const index = panelOrder.indexOf(panelId);
      const spacing = 60; // Increased spacing to prevent overlap
      const bottomMargin = 20;
      const rightMargin = 20;
      const panelWidth = 112; // Button width (80% of 140)
      const panelHeight = 38; // Button height (80% of 48)
      
      setMinimizedPosition({
        x: window.innerWidth - rightMargin - panelWidth,
        y: window.innerHeight - bottomMargin - panelHeight - (spacing * index)
      });
    }
  }, []);

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - (containerRef.current?.offsetWidth || minWidth);
      const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 200);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('.drag-handle')) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      });
      e.preventDefault();
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      
      const maxX = window.innerWidth - (containerRef.current?.offsetWidth || minWidth);
      const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 200);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add event listeners for mouse and touch events
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragStart]);

  const toggleMinimize = () => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    
    if (newMinimized) {
      // Save current position before minimizing
      savedPositionRef.current = position;
      
      // Add to minimized panels set
      minimizedPanels.add(panelId);
      if (!panelOrder.includes(panelId)) {
        panelOrder.push(panelId);
      }
      
      // Calculate position in the bottom-right stack
      const index = panelOrder.indexOf(panelId);
      const spacing = 60; // Increased spacing to prevent overlap
      const bottomMargin = 20; // Distance from bottom
      const rightMargin = 20; // Distance from right
      const panelWidth = 112; // Button width (80% of 140)
      const panelHeight = 38; // Button height (80% of 48)
      
      setMinimizedPosition({
        x: window.innerWidth - rightMargin - panelWidth,
        y: window.innerHeight - bottomMargin - panelHeight - (spacing * index)
      });
    } else {
      // Remove from minimized panels set
      minimizedPanels.delete(panelId);
      panelOrder = panelOrder.filter(id => id !== panelId);
      
      // Restore saved position
      if (savedPositionRef.current) {
        setPosition(savedPositionRef.current);
      }
      
      // Update positions of remaining minimized panels
      updateMinimizedPositions();
    }
  };
  
  const updateMinimizedPositions = () => {
    // Force re-render of all minimized panels to update their positions
    window.dispatchEvent(new CustomEvent('updateMinimizedPanels'));
  };
  
  // Listen for updates to minimized panel positions
  useEffect(() => {
    const handleUpdate = () => {
      if (isMinimized) {
        const index = panelOrder.indexOf(panelId);
        if (index !== -1) {
          const spacing = 60; // Increased spacing to prevent overlap
          const bottomMargin = 20;
          const rightMargin = 20;
          const panelWidth = 112; // Button width (80% of 140)
          const panelHeight = 38; // Button height (80% of 48)
          
          setMinimizedPosition({
            x: window.innerWidth - rightMargin - panelWidth,
            y: window.innerHeight - bottomMargin - panelHeight - (spacing * index)
          });
        }
      }
    };
    
    window.addEventListener('updateMinimizedPanels', handleUpdate);
    return () => window.removeEventListener('updateMinimizedPanels', handleUpdate);
  }, [isMinimized, panelId]);

  if (isMinimized) {
    // Extract text from title, removing any emojis
    let text = title || 'Panel';
    let panelClass = '';
    
    if (title?.includes('Current Location')) {
      text = 'Current Location';
      panelClass = 'current-location-panel';
    } else if (title?.includes('Location Vibe')) {
      text = 'Location Vibe';
      panelClass = 'location-vibe-panel';
    } else if (title?.includes('Statistics')) {
      text = 'Statistics';
      panelClass = 'statistics-panel';
    } else if (title?.includes('Voice')) {
      text = 'Voice Assistant';
    } else {
      // Remove any emoji from the beginning of the title
      const emojiMatch = title?.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u);
      if (emojiMatch) {
        text = title.replace(emojiMatch[0], '').trim();
      }
    }
    
    return (
      <div 
        className={`draggable-panel-minimized ${panelClass} ${className}`}
        style={{
          left: `${minimizedPosition.x}px`,
          top: `${minimizedPosition.y}px`,
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={toggleMinimize}
        title={`Click to expand ${text}`}
        data-panel-id={panelId}
      >
        <div className="minimized-content">
          <span className="minimized-text">{text}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`draggable-panel ${className}`}
      ref={containerRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: `${minWidth}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <div 
        className="drag-handle"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <span className="drag-handle-text">⋮⋮⋮ {title || 'Voice Assistance'} ⋮⋮⋮</span>
        {canMinimize && (
          <button
            onClick={toggleMinimize}
            className="minimize-btn"
          >
            _
          </button>
        )}
      </div>
      <div className="draggable-panel-content">
        {children}
      </div>
    </div>
  );
};

export default DraggablePanel;
