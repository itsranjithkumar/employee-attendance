import { GoogleLogin } from '@react-oauth/google';
import React from 'react';

interface GoogleAuthButtonProps {
  onSuccess: (credential: string) => void;
  onError?: () => void;
  buttonText?: string;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ onSuccess, onError, buttonText }) => {
  // Only allow allowed values for the text prop
  // Default to 'continue_with', or use buttonText if it matches one of the allowed values
  const allowedTextValues = ['signin_with', 'signup_with', 'continue_with', 'signin'] as const;
  const textProp = allowedTextValues.includes((buttonText as any)) ? (buttonText as typeof allowedTextValues[number]) : 'continue_with';

  return (
    <GoogleLogin
      onSuccess={credentialResponse => {
        if (credentialResponse.credential) {
          onSuccess(credentialResponse.credential);
        }
      }}
      onError={onError}
      useOneTap
      text={textProp}
    />
  );
};

export default GoogleAuthButton;
