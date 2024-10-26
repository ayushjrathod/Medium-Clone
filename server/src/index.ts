import { serve } from "@hono/node-server";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate"; //for connection pooling
import { Hono } from "hono";
import { sign } from "hono/jwt";

const app = new Hono<{
  Bindings: {
    DATASOURCE_URL: string;
  };
}>();

app.use("/api/v1/blog/*", async (c, next) => {
  const token = c.req.headers.get("Authorization");
  //if user intends to provided bearer token thne we need to extract token from it
  if (!token) {
    c.status(401);
    return c.json({ message: "Unauthorized" });
  }

  try {
    const response = await verify(token, "secret");
    c.req.user = response;
    return next();
  } catch (e) {
    c.status(401);
    return c.json({ message: "Unauthorized" });
  }
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/api/v1/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATASOURCE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  const user = await prisma.user.create({
    data: {
      email: body.email,
      password: body.password,
      name: body.name,
    },
  });

  const token = await sign({ email: user.id }, "secret");

  return c.json({
    message: "User signed",
    token: token,
  });
});

app.post("/api/v1/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATASOURCE_URL,
  }).$extends(withAccelerate());

  try {
    const body = (await c.req.json()) as { email: string; password: string };

    if (!body.email || !body.password) {
      return c.json({ message: "Please provide email and password" }, 400);
    }

    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }

    // Add password verification logic here

    return c.json({ message: "User signed in" });
  } catch (error) {
    return c.json({ error: "Failed to sign in user" }, 500);
  } finally {
    await prisma.$disconnect();
  }
});

app.post("/api/v1/blog", (c) => {
  return c.json({ message: "Blog created" });
});

app.put("/api/v1/blog/:id", (c) => {
  return c.json({ message: "Blog updated" });
});

app.get("/api/v1/blog/:id", (c) => {
  return c.json({ message: "Blog fetched" });
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
