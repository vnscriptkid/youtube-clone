import { startServer } from "../start";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { user, buildUser } from "seed/users";

let server;

const prisma = new PrismaClient();

beforeAll(async () => {
  server = await startServer();
});

afterAll(() => server.close());

beforeEach(async () => {
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
    const { user, token } = await buildUser();

    const res = await request(server)
      .get("/api/v1/auth/me")
      .set("Cookie", [`token=${token}`])
      .expect(200);

    expect(user.id).toBe(res.body.user.id);

    const { createdAt, id, ...otherFields } = res.body.user;

    expect(otherFields).toMatchInlineSnapshot(`
Object {
  "about": "",
  "avatar": "http://picture.com/123",
  "cover": "https://reedbarger.nyc3.digitaloceanspaces.com/default-cover-banner.png",
  "email": "user@gmail.com",
  "username": "user",
  "videos": Array [],
}
`);
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
});
