npm run 
    npm run dev: "vite",
    npm run build: "vite build",
    npm run lint: "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    npm run preview: "vite preview",
    npm run deploy:web: "npm run build && firebase deploy --only hosting",
    npm run preview:local: "npm run build && vite preview",
    npm run sync:android: "npm run build && npx cap sync android"