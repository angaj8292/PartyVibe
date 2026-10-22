import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || '/ws';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
  }

  connect(onConnected, onError) {
    if (this.client && this.connected) {
      if (onConnected) onConnected();
      return;
    }

    const token = localStorage.getItem('partyvibe_token');

    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_BASE_URL),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: (str) => {
        // console.log('[STOMP]', str);
      },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: (frame) => {
        this.connected = true;
        console.log('[STOMP] Connected successfully');
        if (onConnected) onConnected(frame);
      },
      onStompError: (frame) => {
        console.error('[STOMP] Broker error:', frame.headers['message'], frame.body);
        if (onError) onError(frame);
      },
      onWebSocketClose: () => {
        this.connected = false;
        console.log('[STOMP] Connection closed');
      }
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      console.log('[STOMP] Disconnected');
    }
  }

  subscribe(topic, callback) {
    if (!this.client || !this.connected) {
      console.warn('[STOMP] Cannot subscribe, client not connected yet');
      return null;
    }

    const sub = this.client.subscribe(topic, (message) => {
      try {
        const payload = JSON.parse(message.body);
        callback(payload);
      } catch (err) {
        callback(message.body);
      }
    });

    this.subscriptions.set(topic, sub);
    return sub;
  }

  unsubscribe(topic) {
    const sub = this.subscriptions.get(topic);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(topic);
    }
  }

  send(destination, body = {}) {
    if (!this.client || !this.connected) {
      console.warn('[STOMP] Cannot send, client not connected');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }
}

export const wsService = new WebSocketService();
export default wsService;
