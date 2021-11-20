import request from "supertest";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

import { buildUser } from "seed/users";
import { startServer } from "../start";
import { buildVideo } from "../../../test/seed/videos";
import { getJwtToken } from "../../../test/seed/users";

const prisma = new PrismaClient();

let server;

beforeAll(async () => {
  server = await startServer();
});

afterAll(async () => {
  await prisma.$disconnect();
  await server.close();
});

beforeEach(async () => {
  await prisma.view.deleteMany();
  await prisma.videoLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.video.deleteMany();
  await prisma.user.deleteMany();
});

describe("POST /api/v1/auth/google-login", () => {
  test("returns 200 and token", async () => {
    const payload = {
      idToken: "id-token-123",
    };

    jest.mock("google-auth-library");

    const res = await request(server)
      .post("/api/v1/auth/google-login")
      .send(payload)
      .expect(200);

    const tokenInBody = res.text;

    const setCookie = res.header["set-cookie"][0];

    expect(setCookie).toContain(tokenInBody);

    const users = await prisma.user.findMany();
    expect(users).toHaveLength(1);
    const [user] = users;

    const { id: userId } = jwt.verify(tokenInBody, process.env.JWT_SECRET);
    expect(userId).toBe(user.id);

    const { createdAt, id, ...otherFields } = user;
    expect(otherFields).toMatchInlineSnapshot(`
Object {
  "about": "",
  "avatar": "http://picture.com/123",
  "cover": "https://reedbarger.nyc3.digitaloceanspaces.com/default-cover-banner.png",
  "email": "user@gmail.com",
  "username": "user",
}
`);
  });

  test("do not create new user if user exists", async () => {
    const user = await prisma.user.create({
      data: {
        email: "user@gmail.com",
        username: "user",
      },
    });

    const payload = {
      idToken: "id-token-123",
    };

    jest.mock("google-auth-library");

    const res = await request(server)
      .post("/api/v1/auth/google-login")
      .send(payload)
      .expect(200);

    const { id: userId } = jwt.verify(res.text, process.env.JWT_SECRET);
    expect(userId).toBe(user.id);

    const numOfUsers = await prisma.user.count();
    expect(numOfUsers).toBe(1);
  });
});

describe("GET /api/v1/auth/me", () => {
  test("returns currently logged in user", async () => {
    const user = await buildUser();

    const res = await request(server)
      .get("/api/v1/auth/me")
      .set("Cookie", [`token=${getJwtToken(user)}`])
      .expect(200);

    expect(user.id).toBe(res.body.user.id);

    const { videos, createdAt, ...otherFields } = res.body.user;

    expect(user).toEqual(expect.objectContaining(otherFields));
  });

  test("returns 401 if no token in cookie", async () => {
    const res = await request(server).get("/api/v1/auth/me").expect(401);

    expect(res.body).toMatchInlineSnapshot(`
Object {
  "message": "You need to be logged in to visit this route",
}
`);
  });

  test("returns 401 if token is invalid", async () => {
    const res = await request(server)
      .get("/api/v1/auth/me")
      .set("Cookie", [`token=FAKE_TOKEN`])
      .expect(401);

    expect(res.body).toMatchInlineSnapshot(`
Object {
  "message": "You need to be logged in to visit this route",
}
`);
  });

  test("it eager-loads videos of current user", async () => {
    const user = await buildUser();

    const myVideo = await buildVideo({ user });
    const someoneElseVideo = await buildVideo();

    const res = await request(server)
      .get("/api/v1/auth/me")
      .set("Cookie", [`token=${getJwtToken(user)}`])
      .expect(200);

    const videos = res.body.user.videos;

    expect(videos).toHaveLength(1);
    expect(videos[0].id).toBe(myVideo.id);
  });
});

describe("GET /api/v1/signout", () => {
  test("user can log out if he is already signed in", async () => {
    const user = await prisma.user.create({
      data: {
        email: "user@gmail.com",
        username: "user",
      },
    });

    const tokenPayload = { id: user.id };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    await request(server)
      .get("/api/v1/auth/signout")
      .set("Cookie", [`token=${token}`])
      .expect(200);
  });

  test("user can not logout if he is not signed in yet", async () => {
    const res = await request(server).get("/api/v1/auth/signout").expect(401);

    expect(res.body).toMatchInlineSnapshot(`
Object {
  "message": "You need to be logged in to visit this route",
}
`);
  });
});
