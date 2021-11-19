import moment from "moment";
import request from "supertest";
import { PrismaClient } from "@prisma/client";

import { startServer } from "../start";
import { viewVideo } from "../../../test/seed/views";
import { buildVideo } from "../../../test/seed/videos";
import { buildUser, getJwtToken } from "../../../test/seed/users";

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
  await prisma.comment.deleteMany();
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

    const [fiveViewsVid, fourViewsVid, oneViewVid] = res.body.videos;

    expect(fiveViewsVid.id).toBe(vid2.id);
    expect(fiveViewsVid.views).toBe(5);

    expect(fourViewsVid.id).toBe(vid3.id);
    expect(fourViewsVid.views).toBe(4);

    expect(oneViewVid.id).toBe(vid1.id);
    expect(oneViewVid.views).toBe(1);
  });
});

describe("GET /api/v1/videos/search", () => {
  test("returns 400 if no query provided", async () => {
    const video = await buildVideo({ title: "dog", description: "cat" });

    const res = await request(server).get("/api/v1/videos/search").expect(400);

    expect(res.body).toMatchInlineSnapshot(`
Object {
  "message": "Please enter a search query",
}
`);
  });

  test("returns empty if not found", async () => {
    const video = await buildVideo({ title: "dog", description: "cat" });

    const res = await request(server)
      .get("/api/v1/videos/search")
      .query({ query: "fish" })
      .expect(200);

    expect(res.body).toMatchInlineSnapshot(`
Object {
  "videos": Array [],
}
`);
  });

  test("returns video if title matches", async () => {
    const vid1 = await buildVideo({ title: "fish", description: "fish" });
    const vid2 = await buildVideo({ title: "dog", description: "cat" });

    const res = await request(server)
      .get("/api/v1/videos/search")
      .query({ query: "og" })
      .expect(200);

    expect(res.body.videos).toHaveLength(1);
    expect(res.body.videos[0].id).toBe(vid2.id);
  });

  test("returns video if desc matches", async () => {
    const vid1 = await buildVideo({ title: "dog", description: "cat" });
    const vid2 = await buildVideo({ title: "fish", description: "fish" });

    const res = await request(server)
      .get("/api/v1/videos/search")
      .query({ query: "ca" })
      .expect(200);

    expect(res.body.videos).toHaveLength(1);
    expect(res.body.videos[0].id).toBe(vid1.id);
  });

  test("returns video if title matches but capitalized ", async () => {
    const vid1 = await buildVideo({ title: "doog", description: "cat" });
    const vid2 = await buildVideo({ title: "fish", description: "fish" });

    const res = await request(server)
      .get("/api/v1/videos/search")
      .query({ query: "OO" })
      .expect(200);

    expect(res.body.videos).toHaveLength(1);
    expect(res.body.videos[0].id).toBe(vid1.id);
  });

  test("returns video if desc matches but capitalized ", async () => {
    const vid1 = await buildVideo({ title: "dog", description: "caat" });
    const vid2 = await buildVideo({ title: "fish", description: "fish" });

    const res = await request(server)
      .get("/api/v1/videos/search")
      .query({ query: "AA" })
      .expect(200);

    expect(res.body.videos).toHaveLength(1);
    expect(res.body.videos[0].id).toBe(vid1.id);
  });

  test("user and views are included", async () => {
    const vid1 = await buildVideo({ title: "dog", description: "cat" });
    const vid2 = await buildVideo({ title: "fish", description: "fish" });

    await viewVideo(vid1, 2);

    const res = await request(server)
      .get("/api/v1/videos/search")
      .query({ query: "dog" })
      .expect(200);

    expect(res.body.videos[0].user.id).toBe(vid1.userId);
    expect(res.body.videos[0].views).toBe(2);
  });
});

describe("POST /api/v1/videos (Create new video)", () => {
  test("only authed user can access route", async () => {
    const res = await request(server).post("/api/v1/videos").expect(401);

    expect(res.body).toMatchInlineSnapshot(`
Object {
  "message": "You need to be logged in to visit this route",
}
`);
  });

  test("can create new video", async () => {
    const user = await buildUser();

    const postData = {
      title: "Example title",
      description: "Example description",
      url: "http://example.com/url",
      thumbnail: "http://example.com/url/avatar",
    };

    const res = await request(server)
      .post("/api/v1/videos")
      .set("Cookie", [`token=${getJwtToken(user)}`])
      .send(postData)
      .expect(200);

    expect(res.body.video).toMatchObject(postData);
    const videosInDb = await prisma.video.findMany();
    expect(videosInDb).toHaveLength(1);
    expect(videosInDb[0]).toMatchObject(postData);

    expect(res.body.video.userId).toEqual(user.id);
  });
});

describe("POST /api/v1/videos/:videoId/comments (Add comment for video)", () => {
  test("only authed user can access route", async () => {
    const res = await request(server)
      .post("/api/v1/videos/video-id/comments")
      .expect(401);

    expect(res.body).toMatchInlineSnapshot(`
Object {
  "message": "You need to be logged in to visit this route",
}
`);
  });

  test("returns 404 if video id does not exist", async () => {
    const user = await buildUser();

    const res = await request(server)
      .post("/api/v1/videos/video-id/comments")
      .set("Cookie", [`token=${getJwtToken(user)}`])
      .send({ text: "abc" })
      .expect(404);

    expect(res.body).toMatchInlineSnapshot(`
Object {
  "message": "No video found with id: \\"video-id\\"",
}
`);
  });

  test("add comment for video successfully", async () => {
    const user = await buildUser();
    const video = await buildVideo();

    const res = await request(server)
      .post(`/api/v1/videos/${video.id}/comments`)
      .set("Cookie", [`token=${getJwtToken(user)}`])
      .send({ text: "Example text" })
      .expect(200);

    const commentsInDb = await prisma.comment.findMany();
    expect(commentsInDb).toHaveLength(1);

    const commentInRes = res.body.comment;
    expect(commentInRes.userId).toEqual(user.id);
    expect(commentInRes.videoId).toEqual(video.id);
    expect(commentInRes.id).toEqual(commentsInDb[0].id);
  });
});
