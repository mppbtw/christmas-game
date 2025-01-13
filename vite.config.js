import { defineConfig } from "vite"

export default defineConfig({
    base: "/src/",
    build: {
        target: "esnext",
        rollupOptions: {
            output: {
            },
        },
    }
})
