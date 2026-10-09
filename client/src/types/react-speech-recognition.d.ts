declare module 'react-speech-recognition' {
  interface SpeechRecognitionOptions {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
  }

  interface UseSpeechRecognitionResult {
    transcript: string;
    interimTranscript: string;
    finalTranscript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
  }

  export function useSpeechRecognition(): UseSpeechRecognitionResult;

  const SpeechRecognition: {
    startListening: (options?: SpeechRecognitionOptions) => Promise<void>;
    stopListening: () => Promise<void>;
    abortListening: () => Promise<void>;
    getRecognition: () => SpeechRecognition | null;
  };

  export default SpeechRecognition;
}
