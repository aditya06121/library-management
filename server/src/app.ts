import Fastify from "fastify";

const app = Fastify();

app.register(import("./routes/auth.routes.js"));

export default app;
