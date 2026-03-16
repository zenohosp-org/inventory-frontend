/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0f62fe',
                    hover: '#0043ce',
                    light: '#e0eaff',
                },
                secondary: '#6929c4',
                accent: '#161616',
            }
        },
    },
    plugins: [],
}
