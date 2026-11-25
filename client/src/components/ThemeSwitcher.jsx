import { useTheme } from "../theme/ThemeContext";
import { Monitor, Moon, Sun } from "lucide-react";

function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="theme-switcher">
            <button
                className={theme === "light" ? "theme-option active" : "theme-option"}
                onClick={() => setTheme("light")}
                title="Light mode"
                aria-label="Light mode"
            >
                <Sun size={16} />
            </button>

            <button
                className={theme === "dark" ? "theme-option active" : "theme-option"}
                onClick={() => setTheme("dark")}
                title="Dark mode"
                aria-label="Dark mode"
            >
                <Moon size={16} />
            </button>

            <button
                className={theme === "system" ? "theme-option active" : "theme-option"}
                onClick={() => setTheme("system")}
                title="System theme"
                aria-label="System theme"
            >
                <Monitor size={16} />
            </button>
        </div>
    );
}

export default ThemeSwitcher;