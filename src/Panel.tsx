// components/Panel.tsx
import React, { useState } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';

interface MenuItem {
  label: string;
  action: () => void;
}

interface Menu {
  id: string;
  label: string;
  items: MenuItem[];
}

interface PanelProps {
  title: string;
  borderColor: string;
  menus?: Menu[];
  children: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ title, borderColor, menus, children }) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useClickOutside(() => setOpenMenu(null));

  const handleMenuClick = (menuId: string) => {
    setOpenMenu(openMenu === menuId ? null : menuId);
  };

  return (
    <div className="panel" style={{ borderColor }}>
      <div className="panel-header" style={{ backgroundColor: borderColor }}>
        {title}
      </div>
      {menus && menus.length > 0 && (
        <div className="panel-menu-bar" ref={menuRef}>
          {menus.map(menu => (
            <div key={menu.id} className="menu-container">
              <button
                className="menu-button"
                onClick={() => handleMenuClick(menu.id)}
              >
                {menu.label}
              </button>
              {openMenu === menu.id && (
                <div className="submenu">
                  {menu.items.map((item, index) => (
                    <button
                      key={index}
                      className="submenu-item"
                      onClick={() => {
                        item.action();
                        setOpenMenu(null);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="panel-content">
        {children}
      </div>
    </div>
  );
};

export default Panel;

css

/* Stili per il Panel */
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 2px solid;
  border-radius: 4px;
  overflow: hidden;
}

.panel-header {
  padding: 8px 12px;
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.panel-menu-bar {
  display: flex;
  background-color: #f0f0f0;
  padding: 4px;
  position: relative;
  border-bottom: 1px solid #ccc;
}

.menu-container {
  position: relative;
}

.menu-button {
  padding: 4px 8px;
  margin: 0 2px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
}

.menu-button:hover {
  background-color: #e0e0e0;
}

.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 1000;
  min-width: 150px;
}

.submenu-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
}

.submenu-item:hover {
  background-color: #f0f0f0;
}

.panel-content {
  flex: 1;
  overflow: auto;
}
