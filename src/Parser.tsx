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
enum CharClass {
    BLANK = 0,          // Spazio, Tab (\s)
    QUOTE = 1,          // Doppio apice (") - Inizio/fine letterale
    SEPARATOR = 2,      // Delimitatori di parola (es. , = < > + - * / ( ) [ ] )
    COMMENT_START = 3,  // Punto e virgola (;) - Inizio commento
    NEWLINE = 4,        // Fine riga (\n, \r)
    OTHER = 5,          // Qualsiasi altro carattere (per nomi, numeri)
    END_OF_INPUT = 6,   // Fine dell'input
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
    // [0]BLANK   [1]QUOTE   [2]SEPARATOR   [3]COMMENT [4]NEWLINE [5]OTHER  [6]EOF
    /* [0] START */ [
        [State.START, Action.IGNORE],       // BLANK -> Ignora, resta in START
        [State.IN_LITERAL, Action.APPEND],  // QUOTE -> Entra in LITERAL, Append
        [State.IN_TOKEN, Action.NEW_TOKEN_APPEND], // SEPARATOR -> Tokenizza e Append (separatore è un token)
        [State.IN_COMMENT, Action.IGNORE],  // COMMENT -> Ignora, entra in COMMENT
        [State.START, Action.IGNORE],       // NEWLINE -> Ignora, resta in START
        [State.IN_TOKEN, Action.APPEND],    // OTHER -> Entra in TOKEN, Append
        [State.FINAL, Action.IGNORE]        // EOF -> Fine
    ],
    // [1] IN_TOKEN (Nome/Numero)
    /* [1] IN_TOKEN */ [
        [State.START, Action.FINALISE_TOKEN], // BLANK -> Finalizza, torna in START
        [State.IN_LITERAL, Action.ERROR],     // QUOTE -> Errore (non previsto in un token normale)
        [State.START, Action.FINALISE_TOKEN], // SEPARATOR -> Finalizza il token corrente, torna in START (il SEPARATOR sarà tokenizzato al prossimo ciclo)
        [State.IN_COMMENT, Action.FINALISE_TOKEN], // COMMENT -> Finalizza, entra in COMMENT
        [State.START, Action.FINALISE_TOKEN], // NEWLINE -> Finalizza, torna in START
        [State.IN_TOKEN, Action.APPEND],      // OTHER -> Append, resta in TOKEN
        [State.FINAL, Action.FINALISE_TOKEN]  // EOF -> Finalizza
    ],
    // [2] IN_LITERAL (Stringa tra virgolette)
    /* [2] IN_LITERAL */ [
        [State.IN_LITERAL, Action.APPEND],  // BLANK -> Append (stringhe mantengono spazi)
        [State.START, Action.FINALISE_TOKEN], // QUOTE -> Finalizza (la virgoletta non viene inclusa nel token, ma l'azione andrebbe modificata)
        [State.IN_LITERAL, Action.APPEND],  // SEPARATOR -> Append
        [State.IN_LITERAL, Action.APPEND],  // COMMENT -> Append
        [State.IN_LITERAL, Action.APPEND],  // NEWLINE -> Append (le stringhe LOGO possono estendersi su più righe)
        [State.IN_LITERAL, Action.APPEND],  // OTHER -> Append
        [State.FINAL, Action.ERROR]         // EOF -> Errore (stringa non chiusa)
    ],
    // [3] IN_COMMENT
    /* [3] IN_COMMENT */ [
        [State.IN_COMMENT, Action.IGNORE],  // BLANK -> Ignora
        [State.IN_COMMENT, Action.IGNORE],  // QUOTE -> Ignora
        [State.IN_COMMENT, Action.IGNORE],  // SEPARATOR -> Ignora
        [State.IN_COMMENT, Action.IGNORE],  // COMMENT -> Ignora
        [State.START, Action.IGNORE],       // NEWLINE -> Torna in START
        [State.IN_COMMENT, Action.IGNORE],  // OTHER -> Ignora
        [State.FINAL, Action.IGNORE]        // EOF -> Fine
    ]
];
