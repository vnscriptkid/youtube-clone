const { PrismaClient } = require("@prisma/client");
const { startServer } = require("../server/src/start");
const { join } = require("path");

const prisma = new PrismaClient();

require("dotenv").config({ path: join(__dirname, "../.env.test") });

let server;

beforeAll(async () => {
  server = await startServer();
  global.server = server;
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
