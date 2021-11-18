import moment from "moment";
import request from "supertest";
import { PrismaClient } from "@prisma/client";

import { startServer } from "../start";
import { viewVideo } from "../../../test/seed/views";
import { buildVideo } from "../../../test/seed/videos";

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
  await prisma.video.deleteMany();
  await prisma.user.deleteMany();
});

describe("GET /api/v1/videos", () => {
  test("recommended videos are ordered latest first ", async () => {
    // Arrange
    const weekAgoVideo = await buildVideo({
      createdAt: moment().subtract(7, "days").toDate(),
    });
    const yearAgoVideo = await buildVideo({
      createdAt: moment().subtract(1, "year").toDate(),
    });
    const yesterdayVideo = await buildVideo({
      createdAt: moment().subtract(1, "day").toDate(),
    });

    await viewVideo(weekAgoVideo);

    // Act
    const res = await request(server).get("/api/v1/videos").expect(200);

    // Assert
    expect(res.body.videos).toHaveLength(3);

    const [firstVid, secondVid, thirdVid] = res.body.videos;

    expect(firstVid.id).toBe(yesterdayVideo.id);
    expect(firstVid.views).toBe(0);

    expect(secondVid.id).toBe(weekAgoVideo.id);
    expect(secondVid.views).toBe(1);

    expect(thirdVid.id).toBe(yearAgoVideo.id);
    expect(thirdVid.views).toBe(0);
  });
});

describe("GET /api/v1/videos/trending", () => {
  test("videos are ordered by number of views in ascending order", async () => {
    // Arrange
    const vid1 = await buildVideo();
    const vid2 = await buildVideo();
    const vid3 = await buildVideo();

    await viewVideo(vid2, 5);
    await viewVideo(vid1, 1);
    await viewVideo(vid3, 4);

    // Act
    const res = await request(server)
      .get("/api/v1/videos/trending")
      .expect(200);

    // Assert
    expect(res.body.videos).toHaveLength(3);

    console.log(res.body.videos);

    const [fiveViewsVid, fourViewsVid, oneViewVid] = res.body.videos;

    expect(fiveViewsVid.id).toBe(vid2.id);
    expect(fiveViewsVid.views).toBe(5);

    expect(fourViewsVid.id).toBe(vid3.id);
    expect(fourViewsVid.views).toBe(4);

    expect(oneViewVid.id).toBe(vid1.id);
    expect(oneViewVid.views).toBe(1);
  });
});
