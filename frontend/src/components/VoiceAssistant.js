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
      
      let responseText = '';
      if (data.success && data.results && data.results.length > 0) {
        responseText = `I found ${data.results.length} parking spots. `;
        responseText += `The closest one is ${data.results[0].name} at ${data.results[0].distance} meters away. `;
        if (data.results[0].price) {
          responseText += `It costs ${data.results[0].price} dollars per hour.`;
        }
      } else if (data.explanation) {
        responseText = data.explanation;
      } else {
        responseText = "I couldn't find any parking spots matching your request. Please try again.";
      }
      
      setResponse(responseText);
      speak(responseText);
    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorMessage = "Sorry, I couldn't process your request. Please try again.";
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
