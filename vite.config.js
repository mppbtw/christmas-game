import { defineConfig } from "vite"

export default defineConfig({
    base: "/christmas-game/",
    build: {
        target: "esnext",
        rollupOptions: {
            output: {
            },
        },
    }
})
