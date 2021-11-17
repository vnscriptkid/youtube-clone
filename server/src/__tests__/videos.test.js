import { buildVideo } from "../../../test/seed/videos";
import prisma from "../../prisma";
import moment from "moment";
import request from "supertest";
import { startServer } from "../start";
import { viewVideo } from "../../../test/seed/views";

let server;

beforeAll(async () => {
  server = await startServer();
});

afterAll(() => server.close());

beforeEach(async () => {
  await prisma.view.deleteMany();
  await prisma.video.deleteMany();
  await prisma.user.deleteMany();
});

describe("GET /api/v1/videos", () => {
  test.only("recommended videos are ordered latest first ", async () => {
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

    viewVideo(weekAgoVideo);

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
