import { createContext, useState, useMemo, useEffect } from 'react';
import type { FC, ReactNode } from 'react';

export const ThemeContext = createContext({
    theme: 'cyberpunk',
    setTheme: (theme: string) => {},
});

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState('cyberpunk');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const contextValue = useMemo(() => ({
        theme,
        setTheme,
    }), [theme]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
}; 