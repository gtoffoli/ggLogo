// PanelContainer.tsx

import React, { useState, ReactNode } from 'react';

// Struttura dati per un elemento di menu a cascata
interface MenuItem {
  label: string;
  action?: () => void; // Funzione da eseguire quando cliccato (per voci senza sottomenu)
  submenu?: MenuItem[]; // Array di sottomenu (per voci con sottomenu)
}

interface PanelContainerProps {
  id: string; // ID HTML (es. 'area-a', 'area-b') per applicare gli stili CSS specifici
  title: string;
  borderColor: string;
  menuItems: MenuItem[];
  children: ReactNode; // Il contenuto specifico del pannello (Canvas, Console, Editor)
}

const PanelContainer: React.FC<PanelContainerProps> = ({ id, title, borderColor, menuItems, children }) => {
  // Stato per tenere traccia del sottomenu attualmente aperto
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Gestisce il click sul bottone del menu
  const handleMenuClick = (label: string, action?: () => void) => {
    if (action) {
      action(); // Esegue l'azione immediata
      setActiveSubmenu(null);
    } else {
      // Se non ha azione, apre/chiude il sottomenu
      setActiveSubmenu(activeSubmenu === label ? null : label);
    }
  };

  // Funzione per eseguire un'azione e chiudere tutti i menu
  const executeAction = (action: () => void) => {
    action();
    setActiveSubmenu(null);
  };
  
  // Stili base del pannello (bordo)
  const panelStyle: React.CSSProperties = {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    border: `2px solid ${borderColor}`,
    boxSizing: 'border-box',
    borderRadius: '4px',
    overflow: 'hidden', // Importante per contenere il contenuto figlio
  };

  // Stili della barra di intestazione
  const headerStyle: React.CSSProperties = {
    backgroundColor: borderColor,
    color: '#fff',
    padding: '4px 10px',
    fontWeight: 'bold',
    fontSize: '1.1em',
    flexShrink: 0, // Impedisce che l'header si restringa
  };

  // Stili della barra del menu
  const menuBarStyle: React.CSSProperties = {
    display: 'flex',
    padding: '2px 0',
    backgroundColor: '#eee',
    borderBottom: '1px solid #ccc',
    flexShrink: 0,
    position: 'relative', // Contenitore per i sottomenu posizionati in modo assoluto
    zIndex: 10,
  };
  
  // Stili del contenitore del contenuto
  const contentStyle: React.CSSProperties = {
    flexGrow: 1, // Occupa lo spazio restante
    minHeight: 0, // Permette ai componenti interni (es. CommandLog) di usare height: 100%
  }

  return (
    <div id={id} style={panelStyle}>
      {/* 1. BARRA DI INTESTAZIONE */}
      <div style={headerStyle}>
        {title}
      </div>

      {/* 2. BARRA DEI MENU */}
      <div style={menuBarStyle}>
        {menuItems.map((item) => (
          <div key={item.label} style={{ position: 'relative' }}>
            {/* Bottone del Menu */}
            <button
              onClick={() => handleMenuClick(item.label, item.action)}
              style={{
                background: activeSubmenu === item.label ? '#ddd' : 'transparent',
                border: 'none',
                padding: '4px 8px',
                margin: '0 2px',
                cursor: 'pointer',
                fontWeight: item.action ? 'normal' : 'bold',
              }}
            >
              {item.label}
            </button>

            {/* Sottomenu a Cascata */}
            {item.submenu && activeSubmenu === item.label && (
              <ul
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  backgroundColor: 'white',
                  border: '1px solid #aaa',
                  boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
                  minWidth: '150px',
                  zIndex: 20,
                }}
              >
                {item.submenu.map((subItem) => (
                  <li
                    key={subItem.label}
                    onClick={() => executeAction(subItem.action || (() => console.log(`${subItem.label} action missing`)))}
                    style={{
                      padding: '5px 10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                  >
                    {subItem.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      
      {/* 3. CONTENUTO DEL PANNELLO */}
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

export default PanelContainer;
