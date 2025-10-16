import React, { useState, useEffect, FormEvent } from 'react';
// import CommandInput from './CommandInput'; // Assicurati di creare questi componenti
// import CommandOutput from './CommandOutput'; // Assicurati di creare questi componenti

const CommandInput: React.FC = ({ onEnter }) => {
  const handleEnter = (event) => {
	console.log(event.target.value);
    onEnter(event.target.value);
  };

  return (
    <div className="command-input" style={{ display: 'inline-block', boxSizing: 'border-box', fontFamily: 'monospace', textAlign: 'left', backgroundColor: 'white', color: 'black', padding: '0', margin: '2px', width: '96%', height: '30px' }}>
        <input type="text" style={{verticalAlign: 'middle', textAlign: 'justify', margin: '0', padding: '0', width: '100%', height: '100%' }} onKeyDown={(e) => { if (e.key === 'Enter') { handleEnter(e); }}} />
    </div>
  );
};

interface LogState {
  messages: string[];
}

const CommandLog: React.FC<LogState> = () => {
  const [messages, setMessages] = useState<string[]>([]);

  // Simula l'aggiunta di messaggi
  // useEffect(() => {
  // const interval = setInterval(() => {
  //    setMessages(prevMessages => [...prevMessages, `Log entry at ${new Date().toLocaleTimeString()}`]);
  //  }, 2000);
  //  return () => clearInterval(interval);
  // }, []);

  return (
    <div className="command-line-log" style={{ display: 'inline-block', boxSizing: 'border-box', fontFamily: 'monospace', textAlign: 'left', backgroundColor: 'white', color: 'black', padding: '0', margin: '2px', width: '96%', height: '270px', overflowY: 'scroll' }}>
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
		console.log(`Comando "${command}" non riconosciuto.`);
        return `Comando "${command}" non riconosciuto.`;
    }
  };

  return (
    <div>
      <CommandLog history={outputHistory} />
      <CommandInput onEnter={handleCommandSubmit} />
    </div>
  );
};

export default CommandInterpreter;
