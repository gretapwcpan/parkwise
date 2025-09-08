import React, { useState, useEffect, useRef, useCallback } from 'react';
import VoiceAvatar from './VoiceAvatar';
import './VoiceAssistant.css';

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 370, y: window.innerHeight - 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDraggingFab, setIsDraggingFab] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true); // Start minimized by default
  const [isSpeaking, setIsSpeaking] = useState(false); // Track if system is speaking
  const [errorMessage, setErrorMessage] = useState(''); // Track error messages
  const [permissionStatus, setPermissionStatus] = useState(''); // Track permission status
  const [micLevel, setMicLevel] = useState(0); // Track microphone input level
  const [avatarState, setAvatarState] = useState('idle'); // Avatar animation state
  const savedPositionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  
  // Initialize minimized position on mount
  useEffect(() => {
    // Set initial position to bottom-right corner, accounting for other stacked icons
    // Position it at the top of the stack (4 panels below it)
    setPosition({
      x: window.innerWidth - 160, // Match DraggablePanel positioning
      y: window.innerHeight - 320 // Top of the stack (4 panels * 60px spacing + margin)
    });
  }, []);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const containerRef = useRef(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true; // Changed to true to keep listening
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onerror = (event) => {
      // Only log errors that are not expected
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error('Speech recognition error:', event.error);
      }
      
      // Provide user-friendly error messages
      let userMessage = '';
      switch(event.error) {
        case 'not-allowed':
          userMessage = 'Microphone permission denied. Please allow microphone access and try again.';
          setPermissionStatus('denied');
          break;
        case 'no-speech':
          // Don't show error for no-speech when continuous mode is on
          console.log('No speech detected yet, still listening...');
          return; // Don't stop listening
        case 'audio-capture':
          userMessage = 'No microphone found. Please check your microphone connection.';
          break;
        case 'network':
          userMessage = 'Network error. Please check your internet connection.';
          break;
        case 'aborted':
          // This is expected when we stop listening, don't show error
          console.log('Speech recognition stopped');
          return; // Don't show error for aborted
        default:
          userMessage = `Speech recognition error: ${event.error}`;
      }
      
      if (userMessage) {
        setErrorMessage(userMessage);
      }
      setIsListening(false);
      setIsProcessing(false);
      setIsSpeaking(false);
    };

    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended - isListening:', isListening, 'isSpeaking:', isSpeaking);
      // Don't auto-restart, let the user control it
      setIsListening(false);
    };

    recognitionRef.current.onspeechend = () => {
      console.log('Speech has stopped being detected');
    };

    recognitionRef.current.onaudiostart = () => {
      console.log('Audio capturing started');
    };

    recognitionRef.current.onsoundstart = () => {
      console.log('Some sound is being received');
    };

    recognitionRef.current.onstart = () => {
      console.log('Speech recognition started successfully');
      setErrorMessage(''); // Clear any previous errors
      setPermissionStatus('granted');
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []); // Empty dependency array - only initialize once

  // Define speak function with useCallback to avoid recreation
  const speak = useCallback((text, callback) => {
    if (synthRef.current) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      setIsSpeaking(true);
      setAvatarState('speaking');
      console.log('Speaking:', text);
      
      // Small delay to ensure cancel completes
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to use a female voice if available
        const voices = synthRef.current.getVoices();
        console.log('Available voices:', voices.length);
        const femaleVoice = voices.find(voice => 
          voice.name.includes('Female') || 
          voice.name.includes('Samantha') || 
          voice.name.includes('Victoria')
        );
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
        
        // Set up event handlers
        utterance.onend = () => {
          console.log('Speech synthesis ended successfully');
          setIsSpeaking(false);
          setAvatarState('idle');
          if (callback) {
            callback();
          }
        };
        
        utterance.onerror = (event) => {
          // Only show error if it's not a cancel error
          if (event.error !== 'canceled' && event.error !== 'interrupted') {
            console.error('Speech synthesis error:', event.error);
            // Don't show error message for common non-critical errors
            if (event.error !== 'network') {
              setErrorMessage('Text-to-speech temporarily unavailable. The assistant is still listening.');
            }
          }
          setIsSpeaking(false);
          setAvatarState('idle');
          // Still call callback even if speech fails
          if (callback) {
            setTimeout(callback, 100);
          }
        };
        
        utteranceRef.current = utterance;
        
        try {
          synthRef.current.speak(utterance);
        } catch (error) {
          console.error('Error starting speech:', error);
          setIsSpeaking(false);
          // Still call callback even if speech fails
          if (callback) {
            setTimeout(callback, 100);
          }
        }
      }, 50); // Small delay to ensure previous speech is cancelled
    } else {
      setErrorMessage('Text-to-speech is not available in this browser.');
      setIsSpeaking(false);
      // Still call callback even if speech unavailable
      if (callback) {
        setTimeout(callback, 100);
      }
    }
  }, []);

  // Define stopListening function with useCallback
  const stopListening = useCallback(() => {
    setIsListening(false); // Set this first to prevent restart
    setAvatarState('idle');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort(); // Use abort instead of stop
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setMicLevel(0);
    setIsSpeaking(false);
  }, []);

  const processVoiceCommand = async (command) => {
    setIsProcessing(true);
    setAvatarState('processing');
    
    try {
      // Send to backend for natural language processing with LLM
      const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/search/nl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: command,
          location: {
            lat: 25.0330,
            lng: 121.5654
          }
        }),
      });

      const data = await response.json();
      console.log('Natural language search response:', {
        success: data.success,
        query: command,
        source: data.source || 'unknown',
        isSystemResponse: data.isSystemResponse,
        results: `Array(${data.results?.length || 0})`
      });
      
      // Add source indicator
      const sourceIndicator = data.source === 'keyword_fallback' ? '[⚡ Quick] ' : 
                             data.source === 'llm' ? '[🤖 AI] ' : 
                             data.source === 'fallback_search' ? '[🔍 Basic] ' : '';
      
      let responseText = '';
      
      // Show what the LLM understood if available
      if (data.understanding) {
        console.log('LLM Understanding:', data.understanding);
        // You could display this in the UI if needed
      }
      
      // Check if this is a system response (non-parking query)
      if (data.isSystemResponse) {
        responseText = data.message || "I'm your parking assistant. How can I help you find parking today?";
        responseText += " Say 'stop' when you're done.";
      }
      // Use the message from backend if available
      else if (data.message) {
        responseText = data.message + ' ';
        // Only add parking-specific details if there are results
        if (data.results && data.results.length > 0) {
          responseText += " Say 'stop' or 'goodbye' to end our conversation.";
        }
      }
      // Check if the response was successful and has results
      else if (data.success === true && data.results && data.results.length > 0) {
        // Handle successful search with results
        const numSpots = data.results.length;
        responseText = `I found ${numSpots} parking ${numSpots === 1 ? 'spot' : 'spots'} matching your request. `;
        
        // Describe the first (closest) result
        const closest = data.results[0];
        responseText += `The closest one is ${closest.name}, located ${closest.distance} meters away. `;
        
        if (closest.price) {
          responseText += `It costs ${closest.price} dollars per hour. `;
        }
        
        if (closest.features && closest.features.length > 0) {
          const features = closest.features.map(f => f.replace('_', ' ')).join(', ');
          responseText += `It has ${features}. `;
        }
        
        // Mention other results if available
        if (numSpots > 1) {
          responseText += `There are ${numSpots - 1} other ${numSpots - 1 === 1 ? 'option' : 'options'} available nearby. `;
        }
        
        responseText += `Say "stop" or "goodbye" to end our conversation.`;
      } else if (data.success === false && data.error) {
        // Handle error from backend
        responseText = `I encountered an issue: ${data.error}. The search service might be unavailable. Say "stop" to end.`;
      } else if (data.results && data.results.length === 0) {
        // No results found
        responseText = "I couldn't find any parking spots matching your specific requirements. Try adjusting your search criteria or asking for parking spots near you. Say 'stop' when you're done.";
      } else if (data.explanation) {
        // Use the explanation from the backend if available
        responseText = data.explanation + " Say 'stop' to end our conversation.";
      } else {
        // Fallback response
        responseText = "I couldn't find any parking spots matching your request. Please try again with a different search. Say 'stop' when you're done.";
      }
      
      // Add source indicator to the displayed response
      const displayText = sourceIndicator + responseText;
      setResponse(displayText);
      speak(responseText); // Don't speak the indicator
    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorMessage = "I'm having trouble connecting to the search service. However, there are parking spots available nearby. Please check the map for available spots. Say 'stop' to end.";
      setResponse(errorMessage);
      speak(errorMessage);
    } finally {
      setIsProcessing(false);
      if (!isSpeaking) {
        setAvatarState(isListening ? 'listening' : 'idle');
      }
    }
  };

  // Set up the onresult handler in a separate useEffect that updates when dependencies change
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = (event) => {
        // Don't process results if the system is speaking (to avoid feedback loop)
        if (isSpeaking) {
          return;
        }
        
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
        
        if (event.results[current].isFinal) {
          // Check for stop commands - be more flexible with recognition
          const lowerTranscript = transcript.toLowerCase().trim();
          console.log('Final transcript:', lowerTranscript);
          
          // Check for various stop commands with fuzzy matching
          const stopWords = ['stop', 'cancel', 'goodbye', 'good bye', 'bye', 'end', 'quit', 'exit', 'close', 'finish', 'done'];
          const shouldStop = stopWords.some(word => {
            // Check if the transcript contains the word or is very similar
            if (lowerTranscript.includes(word)) return true;
            // Also check if it's just the word alone (with possible speech recognition errors)
            if (lowerTranscript.length < 15 && lowerTranscript.replace(/[^a-z]/g, '').includes(word.replace(/\s/g, ''))) return true;
            return false;
          });
          
          if (shouldStop) {
            console.log('Stop command detected:', lowerTranscript);
            stopListening();
            speak("Goodbye! Click the microphone button whenever you need help finding parking.");
          } else {
            processVoiceCommand(transcript);
          }
        }
      };
    }
  }, [isSpeaking, stopListening, speak]); // Update when dependencies change

  // Function to monitor microphone input level
  const startMicrophoneMonitor = (stream) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      // Resume audio context if it's suspended (Chrome autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      const microphone = audioContextRef.current.createMediaStreamSource(stream);
      microphone.connect(analyserRef.current);
      
      // Use time domain data instead of frequency for better mic level detection
      analyserRef.current.fftSize = 2048;
      const bufferLength = analyserRef.current.bufferLength;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteTimeDomainData(dataArray);
        
        // Calculate RMS (Root Mean Square) for better audio level detection
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / bufferLength);
        const level = Math.min(100, rms * 500); // Scale to 0-100
        
        setMicLevel(level);
        
        // Log if we detect sound
        if (level > 5) {
          console.log('Sound detected! Level:', level.toFixed(1));
        }
        
        // Keep checking while we have an analyser
        if (analyserRef.current) {
          requestAnimationFrame(checkLevel);
        }
      };
      
      checkLevel();
      console.log('Microphone monitor started successfully');
      
      // Test the stream
      const audioTracks = stream.getAudioTracks();
      console.log('Audio tracks:', audioTracks.length);
      if (audioTracks.length > 0) {
        console.log('Audio track settings:', audioTracks[0].getSettings());
      }
    } catch (error) {
      console.error('Error starting microphone monitor:', error);
    }
  };

  const startListening = () => {
    setTranscript('');
    setResponse('');
    setErrorMessage('');
    setIsListening(true);
    setAvatarState('listening');
    
    // Check if speech recognition is available
    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition not available. Please use Chrome or Edge browser.');
      setIsListening(false);
      return;
    }
    
    // Test microphone access first
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          console.log('Microphone access granted');
          micStreamRef.current = stream;
          
          // Start monitoring microphone level
          startMicrophoneMonitor(stream);
          
          // Speak greeting first, then start recognition after speech ends
          speak("Hi! I'm your parking assistant. How can I help you find parking today?", () => {
            console.log('Greeting finished, starting speech recognition...');
            // Start recognition only after greeting finishes
            if (recognitionRef.current) {
              try {
                console.log('Attempting to start speech recognition...');
                recognitionRef.current.start();
                console.log('Speech recognition start command sent');
                
                // Add a helpful message after a delay
                setTimeout(() => {
                  console.log('Checking if still listening...');
                  if (!transcript) {
                    console.log('Still listening... Please speak clearly into your microphone.');
                  }
                }, 3000);
              } catch (error) {
                console.error('Error starting recognition:', error);
                if (error.message && error.message.includes('already started')) {
                  console.log('Recognition already running');
                } else {
                  setErrorMessage(`Failed to start speech recognition: ${error.message}`);
                  setIsListening(false);
                }
              }
            } else {
              console.error('Recognition ref is null!');
              setErrorMessage('Speech recognition not initialized');
            }
          });
        })
        .catch((error) => {
          console.error('Microphone access denied:', error);
          setErrorMessage('Microphone access denied. Please allow microphone access in your browser settings.');
          setPermissionStatus('denied');
          setIsListening(false);
        });
    } else {
      // Fallback for browsers without getUserMedia
      speak("Hi! I'm your parking assistant. How can I help you find parking today?", () => {
        if (recognitionRef.current && isListening) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error('Error starting recognition:', error);
            setErrorMessage(`Failed to start speech recognition: ${error.message}`);
            setIsListening(false);
          }
        }
      });
    }
  };


  const toggleListening = () => {
    if (isListening || isSpeaking) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleMouseDown = (e) => {
    // Handle FAB dragging
    if (isMinimized && e.target.closest('.voice-assistant-fab')) {
      setIsDraggingFab(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
      return;
    }
    
    // Only start dragging if clicking on the header/button area
    if (e.target.closest('.voice-button') && !e.target.closest('button')) {
      return;
    }
    
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
    if (isDragging || isDraggingFab) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - (isMinimized ? 150 : 370);
      const maxY = window.innerHeight - (isMinimized ? 60 : 200);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = (e) => {
    // If we were dragging the FAB and the drag distance was minimal, treat it as a click
    if (isDraggingFab) {
      const dragDistance = Math.sqrt(
        Math.pow(e.clientX - (dragStart.x + position.x), 2) + 
        Math.pow(e.clientY - (dragStart.y + position.y), 2)
      );
      
      // If drag distance is less than 5 pixels, treat as click
      if (dragDistance < 5) {
        toggleMinimize();
      }
    }
    
    setIsDragging(false);
    setIsDraggingFab(false);
  };

  const handleTouchStart = (e) => {
    // Handle FAB dragging on touch
    if (isMinimized && e.target.closest('.voice-assistant-fab')) {
      const touch = e.touches[0];
      setIsDraggingFab(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      });
      e.preventDefault();
      return;
    }
    
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
    if (isDragging || isDraggingFab) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      
      const maxX = window.innerWidth - (isMinimized ? 150 : 370);
      const maxY = window.innerHeight - (isMinimized ? 60 : 200);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleTouchEnd = (e) => {
    // Check if it was a tap on FAB (minimal movement)
    if (isDraggingFab && e.changedTouches && e.changedTouches[0]) {
      const touch = e.changedTouches[0];
      const dragDistance = Math.sqrt(
        Math.pow(touch.clientX - (dragStart.x + position.x), 2) + 
        Math.pow(touch.clientY - (dragStart.y + position.y), 2)
      );
      
      // If drag distance is less than 5 pixels, treat as tap
      if (dragDistance < 5) {
        toggleMinimize();
      }
    }
    
    setIsDragging(false);
    setIsDraggingFab(false);
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
  }, [isDragging, isDraggingFab, dragStart, isMinimized]);

  const toggleMinimize = () => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    setTranscript('');
    setResponse('');
    
    // Stop listening when minimizing
    if (newMinimized && (isListening || isSpeaking)) {
      stopListening();
    }
    
    // Don't change position when toggling minimize state
    // The button should stay where the user dragged it
  };

  if (isMinimized) {
    return (
      <div 
        className="voice-assistant-fab"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDraggingFab ? 'grabbing' : 'grab',
          transition: isDraggingFab ? 'none' : 'all 0.3s ease'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        title="Drag to move or click to expand"
      >
        <div className="voice-fab-content">
          <span className="voice-label">Voice Helper</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="voice-assistant"
      ref={containerRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <div className="voice-assistant-container">
        <div 
          className="drag-handle"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            padding: '8px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px 12px 0 0',
            margin: '-20px -20px 12px -20px',
            color: 'white',
            fontSize: '12px',
            fontWeight: '600',
            userSelect: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ flex: 1 }}>⋮⋮⋮ Voice Assistance ⋮⋮⋮</span>
          <button
            onClick={toggleMinimize}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            _
          </button>
        </div>
        
        {/* Clickable Animated Avatar */}
        <VoiceAvatar 
          state={avatarState} 
          onClick={toggleListening}
          disabled={isProcessing}
        />
        
        {/* Status text below avatar */}
        <div style={{
          textAlign: 'center',
          fontSize: '14px',
          color: '#666',
          marginBottom: '10px',
          fontWeight: '500'
        }}>
          {isProcessing ? 'Processing...' : 
           isListening ? 'Listening... Click to stop' : 
           isSpeaking ? 'Speaking...' : 
           'Click avatar to speak'}
        </div>

        {(isListening || isSpeaking) && (
          <>
            <button 
              className="stop-button"
              onClick={stopListening}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '10px',
                background: '#f44336',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Stop Conversation
            </button>
            
            {isListening && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                background: '#f5f5f5',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  Microphone Level:
                </div>
                <div style={{
                  width: '100%',
                  height: '20px',
                  background: '#e0e0e0',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${micLevel}%`,
                    height: '100%',
                    background: micLevel > 5 ? '#4caf50' : '#ff9800',
                    transition: 'width 0.1s ease',
                    borderRadius: '10px'
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                  {micLevel > 5 ? '✓ Microphone is detecting sound' : '⚠️ No sound detected - check your mic'}
                </div>
              </div>
            )}
          </>
        )}
        
        {transcript && !isMinimized && (
          <div className="voice-transcript">
            <div className="transcript-label">You said:</div>
            <div className="transcript-text">"{transcript}"</div>
          </div>
        )}
        
        {response && !isMinimized && (
          <div className="voice-response">
            <div className="response-label">Assistant:</div>
            <div className="response-text">{response}</div>
          </div>
        )}
        
        {errorMessage && !isMinimized && (
          <div className="voice-error" style={{
            marginTop: '10px',
            padding: '10px',
            background: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '8px',
            color: '#c62828',
            fontSize: '13px'
          }}>
            <strong>⚠️ Error:</strong> {errorMessage}
          </div>
        )}
        
        {permissionStatus === 'denied' && !isMinimized && (
          <div className="permission-help" style={{
            marginTop: '10px',
            padding: '10px',
            background: '#fff3e0',
            border: '1px solid #ffe0b2',
            borderRadius: '8px',
            color: '#e65100',
            fontSize: '12px'
          }}>
            <strong>To enable microphone:</strong>
            <ol style={{ margin: '5px 0 0 20px', padding: 0 }}>
              <li>Click the lock/info icon in the address bar</li>
              <li>Find "Microphone" in permissions</li>
              <li>Change to "Allow"</li>
              <li>Refresh the page</li>
            </ol>
          </div>
        )}
        
        {!transcript && !response && !errorMessage && !isMinimized && (
          <div className="voice-examples">
            <div className="examples-label">Try saying:</div>
            <ul>
              <li>"Find parking near me"</li>
              <li>"Show me cheap parking spots"</li>
              <li>"Find parking with EV charging"</li>
              <li>"I need covered parking"</li>
              <li>Say "stop" or "goodbye" to end</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;
