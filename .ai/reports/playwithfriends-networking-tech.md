# Play With Friends Networking Technology Plan

## Product Target

The target experience is internet play with a short room code:

- Host creates a lobby.
- Host shares a code.
- Friends enter the code from different networks.
- One player remains the host for lobby and game authority.
- Later versions add voice chat.

This is an Among Us-style join flow. The important distinction is that the room code cannot magically connect browsers by itself. A code needs a rendezvous mechanism that maps the code to connection setup data.

## Browser Networking Constraint

For browser-to-browser multiplayer over the internet, WebRTC is the right browser primitive:

- `RTCDataChannel` can carry game messages.
- Media streams can carry microphone audio later.
- `RTCPeerConnection` handles the peer connection.

But WebRTC does not define signaling. Peers must exchange offer, answer, and ICE candidate data before the peer connection can open. That exchange needs one of these:

- A manual copy/paste or QR flow.
- A third-party matchmaking/signaling network.
- A tiny project-owned signaling server.
- A platform provider such as Firebase, Supabase, PartyKit, or similar.

STUN is commonly needed for NAT discovery. TURN may be needed when direct connections fail; TURN relays traffic, so it is not pure peer-to-peer.

References:

- MDN WebRTC API: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- MDN signaling guide: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling
- WebRTC peer connections: https://webrtc.org/getting-started/peer-connections

## Recommended Architecture

Keep gameplay host-authoritative, but allow a small signaling layer for lobby discovery.

```text
Room code service
  -> maps code to host signaling session
  -> helps guest and host exchange WebRTC setup data

WebRTC data channel
  -> guest sends game action to host
  -> host validates action
  -> host broadcasts approved state

WebRTC media stream, later
  -> players send microphone tracks
  -> small lobbies use peer mesh audio
```

The server, if used, should not run board-game state. It should only help browsers meet.

## Library Options

### Trystero

Trystero is the strongest fit for the first prototype if the goal is "no backend owned by this repo." It provides rooms, peer actions, presence, file/data transfer, and media streams over WebRTC.

Tradeoffs:

- Fastest path to room-code-style multiplayer.
- Keeps this Next app simpler.
- Still depends on a signaling strategy such as Nostr, MQTT, BitTorrent, Firebase, Supabase, IPFS, or a relay.
- Less control over reliability and operational behavior than a custom signaling server.

Use this if speed matters more than controlling every network layer.

Reference:

- Trystero: https://github.com/dmotz/trystero

### PeerJS

PeerJS wraps WebRTC with a simpler peer API. It supports data connections and media calls. It needs a PeerServer for brokering connection metadata. PeerServer can be self-hosted.

Tradeoffs:

- Good balance between simplicity and control.
- Natural upgrade path for audio.
- Requires accepting a signaling server.
- More explicit room-code mapping needs to be built by us.

Use this if we want a clean, controlled MVP that can become production-like later.

References:

- PeerJS client docs: https://peerjs.com/client/getting-started
- PeerServer docs: https://peerjs.com/server/getting-started

### simple-peer

`simple-peer` is a lower-level wrapper around WebRTC. It is useful when the app owns the signaling layer and wants a minimal abstraction over peer connections.

Tradeoffs:

- Small, direct, flexible.
- Requires building signaling, room codes, presence, reconnects, and media UX.
- Best after the protocol is clearer.

Use this if we decide to build our own signaling service.

Reference:

- simple-peer: https://github.com/feross/simple-peer

### Socket.IO Or Plain WebSocket

Socket.IO or WebSocket is not the game transport if the product wants peer-to-peer gameplay. It can be the signaling channel.

Tradeoffs:

- Very clear room-code implementation.
- Easy to debug.
- Server is required.
- Can accidentally become the game server if boundaries are not kept strict.

Use this if room-code reliability and implementation clarity matter more than "no server at all."

Reference:

- Socket.IO docs: https://socket.io/docs/v4/

## Audio Chat Later

For a small friend lobby, start with WebRTC mesh audio:

```text
Player A sends audio to B, C, D
Player B sends audio to A, C, D
Player C sends audio to A, B, D
Player D sends audio to A, B, C
```

This keeps the architecture peer-to-peer, but bandwidth grows with each player. It is acceptable for small rooms, not large voice lobbies.

When rooms become larger or reliability matters, move audio to an SFU:

- LiveKit.
- mediasoup.
- Daily.
- Twilio Video.

An SFU is not peer-to-peer. It is a media server that forwards audio/video streams efficiently.

## Recommended Sequence

### Phase 1: No Network

- Build lobby UI and game bridge locally.
- Add local mock room code.
- Add local player state and game selection.
- Add Tic-tac-toe as the first game.

### Phase 2: Trystero Prototype

- Add a `NetworkAdapter` interface.
- Implement `TrysteroNetworkAdapter`.
- Use room code as room id.
- Send lobby and game messages as typed actions.
- Test across two browsers and two networks.

### Phase 3: Reliability Decision

If Trystero is reliable enough:

- Keep it.
- Add audio streams through the same layer.
- Add reconnect and host-ended-lobby states.

If Trystero is not reliable enough:

- Replace it with PeerJS plus a self-hosted PeerServer.
- Or build a tiny WebSocket signaling service and use `simple-peer`.

### Phase 4: Audio

- Add microphone permission flow.
- Add mute/unmute.
- Add per-player audio connection state.
- Use mesh audio for small rooms.
- Revisit SFU only when room size or reliability requires it.

## Adapter Boundary

The UI and games should not import a specific networking library.

```ts
export type NetworkAdapter = {
  createRoom: (roomCode: string, localPlayer: LobbyPlayer) => Promise<void>;
  joinRoom: (roomCode: string, localPlayer: LobbyPlayer) => Promise<void>;
  sendToHost: (message: PeerMessage) => void;
  broadcast: (message: PeerMessage) => void;
  leave: () => void;
  onMessage: (handler: (message: PeerMessage) => void) => () => void;
  onPeerChange: (handler: (peers: LobbyPlayer[]) => void) => () => void;
};
```

This keeps Trystero, PeerJS, or a custom WebRTC implementation replaceable.

## Current Recommendation

Build the app now with a fake local adapter. For internet multiplayer, try Trystero first because it best matches the experimental scope and future audio needs without immediately adding a backend. Keep the adapter boundary strict so the project can move to PeerJS or custom signaling if reliability becomes more important than setup speed.
