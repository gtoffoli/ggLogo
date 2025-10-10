import React, { useState, useEffect, FormEvent } from 'react';
// import CommandInput from './CommandInput'; // Assicurati di creare questi componenti
// import CommandOutput from './CommandOutput'; // Assicurati di creare questi componenti

interface CommandInputProps {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
}

const CommandInput: React.FC<CommandInputProps> = ({ label, value, onChange }) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="command-input">
      <label>
        {label}:{' '}
        <input type="text" value={value} onChange={handleChange} />
      </label>
    </div>
  );
};

interface LogState {
  messages: string[];
}

const CommandLog: React.FC<LogState> = () => {
  const [messages, setMessages] = useState<string[]>([]);

  // Simula l'aggiunta di messaggi
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(prevMessages => [...prevMessages, `Log entry at ${new Date().toLocaleTimeString()}`]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="command-line-log" style={{ fontFamily: 'monospace', backgroundColor: '#000', color: '#00FF00', padding: '10px', overflowY: 'scroll', height: '300px' }}>
      {messages.map((msg, index) => (
        <div key={index}>{msg}</div>
      ))}
    </div>
  );
};

interface Command {
  input: string;
  output: string;
}

const CommandInterpreter: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [outputHistory, setOutputHistory] = useState<Command[]>([]);

  const handleCommandSubmit = (commandText: string) => {
    // Simula l'elaborazione di un comando
    const result = processCommand(commandText);
    setOutputHistory(prevHistory => [...prevHistory, { input: commandText, output: result }]);
    setInput(''); // Azzera l'input dopo l'invio
  };

  const processCommand = (command: string): string => {
    // Logica per interpretare ed eseguire i comandi
    switch (command.toLowerCase()) {
      case 'hello':
        return 'Hello, World!';
      case 'date':
        return new Date().toLocaleDateString();
      default:
        return `Comando "${command}" non riconosciuto.`;
    }
  };

  return (
    <div>
      <CommandLog history={outputHistory} />
      <CommandInput onSubmit={handleCommandSubmit} />
    </div>
  );
};

export default CommandInterpreter;
