import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate"; //for connection pooling
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { signinInput, signupInput } from "../../../comman/src/index";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

userRouter.post("/signup", async (c) => {
  const body = await c.req.json();
  const { success } = signupInput.safeParse(body);

  if (!success) {
    c.status(411);
    return c.json({
      message: "Inputs not correct",
    });
  }
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const user = await prisma.user.create({
      data: {
        username: body.username,
        password: body.password,
        name: body.name,
      },
    });
    const jwt = await sign(
      {
        id: user.id,
      },
      "secret"
    );

    return c.text(jwt);
  } catch (e) {
    console.log(e);
    c.status(411);
    return c.text("Invalid");
  }
});

userRouter.post("/signin", async (c) => {
  const body = await c.req.json();
  const { success } = signinInput.safeParse(body);

  if (!success) {
    c.status(411);
    return c.json({
      message: "Inputs not correct",
    });
  }

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const user = await prisma.user.findFirst({
      where: {
        username: body.username,
        password: body.password,
      },
    });
    if (!user) {
      c.status(403);
      return c.json({
        message: "Incorrect creds",
      });
    }
    const jwt = await sign(
      {
        id: user.id,
      },
      "secret"
    );

    return c.text(jwt);
  } catch (e) {
    console.log(e);
    c.status(411);
    return c.text("Invalid");
  }
});
