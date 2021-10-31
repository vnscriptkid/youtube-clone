import { startServer } from "../start";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

let server;

const prisma = new PrismaClient();

beforeAll(async () => {
  server = await startServer();
});

afterAll(() => server.close());

describe("POST /api/v1/auth/google-login", () => {
  beforeEach(async () => {
    await prisma.video.deleteMany();
    await prisma.user.deleteMany();
  });

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
});
