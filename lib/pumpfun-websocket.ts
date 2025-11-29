export const createPumpFunWebSocket = () => {
  if (typeof window === 'undefined') return null;

  const ws = new WebSocket('wss://rpc.api-pump.fun/ws');

  ws.onopen = () => {
    console.log('Connected to Pump.fun WebSocket');

    ws.send(JSON.stringify({
      method: 'subscribeTrades',
      params: []
    }));

    ws.send(JSON.stringify({
      method: 'subscribeNewTokens',
      params: []
    }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Pump.fun WebSocket data:', data);
    } catch (error) {
      console.error('Error parsing WebSocket data:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('Pump.fun WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('Pump.fun WebSocket connection closed');
  };

  return ws;
};


