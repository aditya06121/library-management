import Fastify from "fastify";
import authRoutes from "./routes/auth.routes.js";
import cookie from "@fastify/cookie";

const app = Fastify();

app.register(cookie);
app.register(authRoutes, { prefix: "/auth" });

export default app;
