// Parser.tsx
// 251022 - 1st version with Gemini
// 251023 - fixed bugs in getCharClass (END_OF_INPUT), FSM matrix and logoTokenizerFSM (remove i--, actions)
// 251107 - started extension of Parser


import { CellType, Cell, SEPARATORS } from './CoreDefinitions';
import { LANGUAGE_MAPS } from './LocalizationMaps';
import { localizeBoolean } from './Logic';

// A. STATI DELLA FSM (Righe della matrice)
enum State {
    START = 0,          // Stato iniziale (In attesa del primo carattere)
    IN_TOKEN = 1,       // All'interno di un token non-stringa (nome, numero, operatore)
    IN_LITERAL = 2,     // All'interno di una stringa letterale (dopo '"')
    IN_COMMENT = 3,     // All'interno di un commento (dopo ';')
    FINAL = 4,          // Stato finale (o di accettazione, teorico)
    // Aggiungere altri stati se necessario (es. IN_NUMBER, IN_OPERATOR)
}

// B. CLASSI LESSICALI (Colonne della matrice)
export enum CharClass {
    BLANKSPACE = 0,     // Spazio, Tab (\s)
    QUOTE = 1,          // Doppio apice (") e duepunti (:)
    SEPARATOR = 2,      // Delimitatori di parola (es. , = < > + - * / ( ) [ ] )
    COMMENT_START = 3,  // Punto e virgola (;) - Inizio commento
    NEWLINE = 4,        // Fine riga (\n, \r)
    OTHER = 5,          // Qualsiasi altro carattere (per nomi, numeri)
    END_OF_INPUT = 6,   // Fine dell'input
    BACKSLASH = 7,      // Back slash (\\) - letteralizza 1 carattere
}

// C. AZIONI DA ESEGUIRE (Codice di Azione)
enum Action {
    IGNORE = 0,             // Scarta il carattere corrente
    APPEND = 1,             // Aggiungi il carattere al token corrente
    NEW_TOKEN_APPEND = 2,   // Finalizza il token precedente, inizia un nuovo token con il carattere corrente
    FINALISE_TOKEN = 3,     // Finalizza il token corrente (non aggiunge il carattere)
    ERROR = 99,             // Errore lessicale
}

// D. STRUTTURA DELLA TRANSIZIONE (Cella della matrice)
type Transition = [State, Action]; // [Nuovo Stato, Azione]

const FSM_MATRIX: Transition[][] = [
    // [0]BLANKSPACE   [1]QUOTE   [2]SEPARATOR   [3]COMMENT [4]NEWLINE [5]OTHER  [6]EOF	[7]BACKSLASH
    /* [0] START */ [
        [State.START, Action.IGNORE],       // BLANKSPACE -> Ignora, resta in START
        // [State.IN_LITERAL, Action.APPEND],  // QUOTE -> Entra in LITERAL, Append
        [State.IN_LITERAL, Action.NEW_TOKEN_APPEND],  // QUOTE -> Entra in LITERAL e Append (QUOTE è un token)
        // [State.IN_TOKEN, Action.NEW_TOKEN_APPEND], // SEPARATOR -> Tokenizza e Append (separatore è un token)
        [State.START, Action.NEW_TOKEN_APPEND], // SEPARATOR -> Tokenizza e Append (separatore è un token)
        [State.IN_COMMENT, Action.IGNORE],  // COMMENT -> Ignora, entra in COMMENT
        [State.START, Action.IGNORE],       // NEWLINE -> Ignora, resta in START
        [State.IN_TOKEN, Action.APPEND],    // OTHER -> Entra in TOKEN, Append
        [State.FINAL, Action.IGNORE],       // EOF -> Fine
        [State.IN_TOKEN, Action.IGNORE]     // ma BACKSLASH ha un side-effect
    ],
    /* [1] IN_TOKEN (Parola/Numero) */ [
        [State.START, Action.FINALISE_TOKEN], // BLANK -> Finalizza, torna in START
        [State.IN_LITERAL, Action.ERROR],     // QUOTE -> Errore (non previsto in un token normale)
        [State.START, Action.FINALISE_TOKEN], // SEPARATOR -> Finalizza il token corrente, torna in START (il SEPARATOR sarà tokenizzato al prossimo ciclo)
        [State.IN_COMMENT, Action.FINALISE_TOKEN], // COMMENT -> Finalizza, entra in COMMENT
        [State.START, Action.FINALISE_TOKEN], // NEWLINE -> Finalizza, torna in START
        [State.IN_TOKEN, Action.APPEND],      // OTHER -> Append, resta in TOKEN
        [State.FINAL, Action.FINALISE_TOKEN], // EOF -> Finalizza
        [State.IN_TOKEN, Action.IGNORE]       // ma BACKSLASH ha un side-effect
    ],
    /* [2] IN_LITERAL (Stringa preceduta da virgolette) */ [
        // [State.IN_LITERAL, Action.APPEND],  // BLANKSPACE -> Append (stringhe mantengono spazi)
        [State.START, Action.FINALISE_TOKEN],  // BLANKSPACE -> Append (stringhe NON mantengono spazi)
        // [State.START, Action.FINALISE_TOKEN], // QUOTE -> Finalizza (la virgoletta non viene inclusa nel token, ma l'azione andrebbe modificata)
        [State.IN_LITERAL, Action.ERROR], // QUOTE -> Errore (In Iperlogo il QUOTE non va chiuso)
        // [State.IN_LITERAL, Action.APPEND],  // SEPARATOR -> Append
        [State.START, Action.FINALISE_TOKEN],  // SEPARATOR -> Append
        [State.IN_LITERAL, Action.APPEND],  // COMMENT -> Append
        [State.IN_LITERAL, Action.APPEND],  // NEWLINE -> Append (le stringhe LOGO possono estendersi su più righe)
        [State.IN_LITERAL, Action.APPEND],  // OTHER -> Append, resta in LITERAL
        // [State.FINAL, Action.ERROR]         // EOF -> Errore (stringa non chiusa)
        [State.FINAL, Action.FINALISE_TOKEN],// EOF -> Append (una stringa letterale può terminare insieme con l'input)
        [State.IN_LITERAL, Action.IGNORE]   // ma BACKSLASH ha un side-effect
    ],
    /* [3] IN_COMMENT */ [
        [State.IN_COMMENT, Action.IGNORE],  // BLANKSPACE -> Ignora
        [State.IN_COMMENT, Action.IGNORE],  // QUOTE -> Ignora
        [State.IN_COMMENT, Action.IGNORE],  // SEPARATOR -> Ignora
        [State.IN_COMMENT, Action.IGNORE],  // COMMENT -> Ignora
        [State.START, Action.IGNORE],       // NEWLINE -> Torna in START
        [State.IN_COMMENT, Action.IGNORE],  // OTHER -> Ignora
        [State.FINAL, Action.IGNORE],       // EOF -> Fine
        [State.IN_COMMENT, Action.IGNORE]   // BACKSLASH
    ]
];

export const infix_operators = '+-*/^<=>';

/**
 * Classificatore Lessicale: Mappa un carattere alla sua classe.
 */
export function getCharClass(char: string | undefined): CharClass {
    // if (char === undefined) return CharClass.END_OF_INPUT;
    if ((char === undefined) || (char.charCodeAt(0) === 0)) return CharClass.END_OF_INPUT;
    
    // Lista di separatori tipici (non gestisce la logica avanzata di operatore/parentesi)
    const separators = infix_operators + '()[],'; 
    const quotes = '\":'; 
    const blanks = ' \t'; 

    // if (/\s/.test(char)) {
    if (blanks.includes(char)) {
        return CharClass.BLANKSPACE;
    } else if (quotes.includes(char)) {
        return CharClass.QUOTE;
    } else if (char === '\\') {
        return CharClass.BACKSLASH;
    } else if (char === ';') {
        return CharClass.COMMENT_START;
    } else if (char === '\n' || char === '\r') {
        return CharClass.NEWLINE;
    } else if (separators.includes(char)) {
        return CharClass.SEPARATOR;
    } else {
        return CharClass.OTHER;
    }
}

/**
 * Funzione Principale del Tokenizer
 */
// export function logoTokenizerFSM(input: string): string[] {
function logoTokenizerFSM(input: string): string[] {
    const tokens: string[] = [];
    let currentState: State = State.START;
    let currentToken: string = '';
    let i = 0;

    // Aggiungiamo un terminatore implicito per gestire l'ultimo token
    const fullInput = input + '\0'; 

    while (currentState !== State.FINAL) {
        var char = fullInput[i];
        var charClass = getCharClass(char);
        
        // Cerca la transizione nella matrice
        var transition = FSM_MATRIX[currentState][charClass];
        if (!transition) {
            console.error(`Errore di transizione non definita in stato ${currentState} con classe ${charClass}`);
            break;
        }

        var [nextState, action] = transition;
 
        // Esecuzione dell'Azione (Side Effect)
        switch (action) {
            case Action.IGNORE:
                // Non fa nulla con il carattere, ma se si tratta di un BACKSLASH ..
                console.log(currentState, 'IGNORE', currentToken, fullInput, i)
                if ((charClass === CharClass.BACKSLASH) && (currentState != State.IN_COMMENT) && (i < fullInput.length)) {
					i++;
					currentToken += fullInput[i];
					console.log('IGNORE', currentToken)
				}
                break;
            case Action.APPEND:
                currentToken += char;
                break;
            case Action.FINALISE_TOKEN:
                if (currentToken.length > 0) {
                    tokens.push(currentToken);
                }
                currentToken = '';
                break;
            case Action.NEW_TOKEN_APPEND:
                if (currentToken.length > 0)
                    tokens.push(currentToken); // Finalizza il precedente
                currentToken = char; // Inizia il nuovo token con il carattere corrente
                if ((charClass === CharClass.QUOTE) || (charClass === CharClass.SEPARATOR)){
					// LOOK-AHEAD per separatori multi-carattere
               	    if (   (charClass === CharClass.SEPARATOR)
                        && (i < fullInput.length)
						&& (Object.keys(SEPARATORS).includes(currentToken + fullInput[i+1]))
					    ) {
							tokens.push(currentToken + fullInput[i+1]);
							i++;
				    	}
				    else
                    	tokens.push(currentToken);
                    currentToken = '';
                }
                break;
            case Action.ERROR:
                throw new Error(`Errore lessicale in stato ${currentState} al carattere ${i}: ${char}`);
        }
        
        // Passaggio di Stato
        currentState = nextState;
        
        // Avanzamento dell'Input
        if (action !== Action.FINALISE_TOKEN) {
             i++;
        }
       
    }

    return tokens;
}

export function Parse(input: string): any[] {
	const tokens = logoTokenizerFSM(input);
	var parse_stack = [];
	var parse_level = 0;
	var parsed = [];
	var token = null;
	var cell: Cell | any[];
	var token_type;
	var cell_type: CellType;
	for (var i = 0; i < tokens.length; i++) {
		token = tokens[i];
		if (token === '[') {
			parse_stack.push(parsed)
			parse_level += 1;
			parsed = [];
		} else if (token === ']') {
			if (parse_level > 0) {
				cell = {type: CellType.LIST, val: parsed};
				parsed = parse_stack.pop();
				parsed.push(cell);
				parse_level -= 1;
			}
		} else {
			// if (token.length === 1) {
			if ((token.length >= 1) && (token.length <= 2)) { // gestisci operatori di relazione multi-carattere! 
				// token_type = getCharClass(token);
				token_type = getCharClass(token[0]); // gestisci operatori di relazione multi-carattere! 
        		switch (token_type) {
            		case CharClass.QUOTE:
						cell_type = CellType.QUOTE;
						break;
            		case CharClass.SEPARATOR:
						cell_type = CellType.OPERATOR;
						break;
            		case CharClass.OTHER:
						cell_type = CellType.WORD;
						break;
				}
			}
			else
				cell_type = CellType.WORD;
			parsed.push({'type': cell_type, 'val': token});
		}
	}
	return parsed;
}

export function unParse(body: any[]): any[] {
  /*
 	var output = "";
	var node;
	var value;
	for (var i=0; i<body.length; i++) {
		node = body[i];
		if (Array.isArray(node))
			output += '['+unParse(node)+']';
		else if (typeof node === 'string') {
			output += node+' ';
		}
		else if (node.type === CellType.BOOLEAN)
			output += localizeBoolean(node.val);
		else if (node.type === CellType.LIST) 
			output += '['+unParse(node.val)+']';
		else {
			value = node.val.toString();
			output += value;
			if (! '\"\:'.includes(value))
				output += ' ';
		}
		output = output.replace(/\ \]/, "]");
	}
	return output;
  */
  return nodeToString(body, true);
}

// da rivedere
export function nodeToString(node: Cell | Cell[], showBrackets: boolean): string {
  var output = "";
  var value;
  if (Array.isArray(node))
    for (var i=0; i<node.length; i++)
      output += nodeToString(node[i], showBrackets);
  else if (node.type !== undefined) {
    if (node.type === CellType.BOOLEAN)
      output += localizeBoolean(node.val);
    else if (node.type === CellType.LIST) {
      if (showBrackets)
        output += ' [';
      // output += nodeToString(node.val, showBrackets);
      output += nodeToString(node.val, true);
      if (showBrackets)
        output += '] ';
    }
    else {
      value = node.val.toString();
      output += value;
      if (! '\"\:'.includes(value))
        output += ' ';
    }
  }
  else output += node.toString();
  output = output.replace(/\ \]/, "]");
  return output;
}

