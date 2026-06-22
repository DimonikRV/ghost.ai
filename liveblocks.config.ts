// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      cursor: { x: number; y: number };
      isThinking: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {};

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        userId: string;
        displayName: string;
        avatarUrl: string;
        role: "owner" | "member" | "guest";
        cursorColor: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: {};

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {
      // Example, attaching coordinates to a thread
      // x: number;
      // y: number;
    };

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {
      // Example, rooms with a title and url
      // title: string;
      // url: string;
    };
  }
}

export { };
