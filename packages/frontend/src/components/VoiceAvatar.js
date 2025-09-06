import React from 'react';
import './VoiceAvatar.css';

const VoiceAvatar = ({ state = 'idle', onClick, disabled = false }) => {
  return (
    <div 
      className={`voice-avatar-container ${disabled ? 'disabled' : ''}`}
      onClick={!disabled ? onClick : undefined}
      role="button"
      tabIndex={!disabled ? 0 : -1}
      aria-label={
        state === 'listening' ? 'Listening... Click to stop' : 
        state === 'speaking' ? 'Speaking...' : 
        state === 'processing' ? 'Processing...' : 
        'Click to speak'
      }
    >
      <div className={`voice-avatar ${state}`}>
        <div className="avatar-eyes">
          <div className="avatar-eye"></div>
          <div className="avatar-eye"></div>
        </div>
        <div className="avatar-mouth"></div>
      </div>
      <div className="sound-waves">
        <div className="sound-wave"></div>
        <div className="sound-wave"></div>
        <div className="sound-wave"></div>
      </div>
      {state === 'speaking' && (
        <div className="sparkles">
          <span className="sparkle">✨</span>
          <span className="sparkle">✨</span>
          <span className="sparkle">✨</span>
          <span className="sparkle">✨</span>
        </div>
      )}
    </div>
  );
};

export default VoiceAvatar;
