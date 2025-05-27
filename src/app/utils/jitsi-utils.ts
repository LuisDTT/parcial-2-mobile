declare global {
  interface Window {
    AndroidJitsi?: {
      startJitsiCall: (meetingId: string) => void;
    };
  }
}

export function startJitsiCall(meetingId: string) {
  if (window.AndroidJitsi?.startJitsiCall) {
    window.AndroidJitsi.startJitsiCall(meetingId);
  } else {
    console.warn('AndroidJitsi no disponible');
  }
}
