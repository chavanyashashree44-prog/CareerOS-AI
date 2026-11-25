import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("careeros-theme") || "system";
    });

    useEffect(() => {
        const root = document.documentElement;

        root.classList.remove("light", "dark");

        if (theme === "system") {
            const prefersDark = window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;

            root.classList.add(prefersDark ? "dark" : "light");
        } else {
            root.classList.add(theme);
        }

        localStorage.setItem("careeros-theme", theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}