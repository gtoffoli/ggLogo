import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    "/*": {
      async GET(req) {
        const url = new URL(req.url);
        const path = url.pathname;

        // 1. Prova a vedere se il file esiste nella cartella public
        const publicFile = Bun.file(`./public${path}`);
        if (await publicFile.exists()) {
          return new Response(publicFile);
        }
      }
    },

    // Serve index.html for all unmatched routes.
    // "/*": index,
    "/": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Ciao mondo!", // "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Ciao mondo!", // "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
