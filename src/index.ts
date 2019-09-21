import "dotenv/config";
import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./UserResolver";
import { createConnection } from "typeorm";
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";
import cors from "cors";

import { User } from "./entity/User";
import { createAccessToken, createRefreshToken } from "./createToken";
import { updateRefreshToken } from "./updateRefresh";

(async () => {
  const app = express();
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true
    })
  );
  app.use(cookieParser());
  app.get("/", (_req, res) => {
    res.send(`
        <h1>Hello from JWT Authentication with Node.JS and React</h1>
    `);
  });

  app.post("/refresh_token", async (req, res) => {
    const token = req.cookies._jimtcour;
    if (!token) {
      return res.send({ ok: false, accessToken: "" });
    }
    let payload: any = null;
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
    } catch (err) {
      console.error(err);
      return res.send({ ok: false, accessToken: "" });
    }

    // if the token is valid, we send back an access token
    const user = await User.findOne({ id: payload.userId });
    if (!user) {
      return res.send({ ok: false, accessToken: "" });
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return res.send({ ok: false, accessToken: "" });
    }

    updateRefreshToken(res, createRefreshToken(user));
    return res.send({ ok: true, accessToken: createAccessToken(user) });
  });

  // Connect to database
  await createConnection();

  // ApolloServer
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver]
    }),
    context: ({ req, res }) => ({ req, res })
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4500, () => console.log("server is starting on port 4500"));
})();
