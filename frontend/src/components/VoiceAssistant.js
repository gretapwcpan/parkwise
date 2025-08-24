import React, { useState, useEffect, useRef } from 'react';
import './VoiceAssistant.css';

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      setTranscript(transcript);
      
      if (event.results[current].isFinal) {
        processVoiceCommand(transcript);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setIsProcessing(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const processVoiceCommand = async (command) => {
    setIsProcessing(true);
    
    try {
      // Send to backend for natural language processing
      const response = await fetch('http://localhost:3001/api/locations/search/natural', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: command,
          userLocation: {
            lat: 25.0330,
            lng: 121.5654
          }
        }),
      });

      const data = await response.json();
      console.log('Natural language search response:', data);
      
      let responseText = '';
      
      // Check if the response was successful and has results
      if (data.success === true && data.results && data.results.length > 0) {
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
          responseText += `There are ${numSpots - 1} other ${numSpots - 1 === 1 ? 'option' : 'options'} available nearby.`;
        }
      } else if (data.success === false && data.error) {
        // Handle error from backend
        responseText = `I encountered an issue: ${data.error}. The search service might be unavailable.`;
      } else if (data.results && data.results.length === 0) {
        // No results found
        responseText = "I couldn't find any parking spots matching your specific requirements. Try adjusting your search criteria or asking for parking spots near you.";
      } else if (data.explanation) {
        // Use the explanation from the backend if available
        responseText = data.explanation;
      } else {
        // Fallback response - this shouldn't happen with the current backend
        responseText = "I couldn't find any parking spots matching your request. Please try again with a different search.";
      }
      
      setResponse(responseText);
      speak(responseText);
    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorMessage = "I'm having trouble connecting to the search service. However, there are parking spots available nearby. Please check the map for available spots.";
      setResponse(errorMessage);
      speak(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const speak = (text) => {
    if (synthRef.current) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to use a female voice if available
      const voices = synthRef.current.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') || 
        voice.name.includes('Victoria')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      synthRef.current.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setResponse('');
      recognitionRef.current?.start();
      setIsListening(true);
      speak("Hi! I'm your parking assistant. How can I help you find parking today?");
    }
  };

  return (
    <div className="voice-assistant">
      <div className="voice-assistant-container">
        <button 
          className={`voice-button ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`}
          onClick={toggleListening}
          disabled={isProcessing}
        >
          <div className="voice-icon">
            {isProcessing ? '⚡' : isListening ? '🎤' : '🎙️'}
          </div>
          <div className="voice-status">
            {isProcessing ? 'Processing...' : isListening ? 'Listening...' : 'Click to speak'}
          </div>
        </button>
        
        {transcript && (
          <div className="voice-transcript">
            <div className="transcript-label">You said:</div>
            <div className="transcript-text">"{transcript}"</div>
          </div>
        )}
        
        {response && (
          <div className="voice-response">
            <div className="response-label">Assistant:</div>
            <div className="response-text">{response}</div>
          </div>
        )}
        
        <div className="voice-examples">
          <div className="examples-label">Try saying:</div>
          <ul>
            <li>"Find parking near me"</li>
            <li>"Show me cheap parking spots"</li>
            <li>"Find parking with EV charging"</li>
            <li>"I need covered parking"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
