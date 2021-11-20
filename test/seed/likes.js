const { PrismaClient } = require("@prisma/client");
const { buildUser } = require("./users");

const prisma = new PrismaClient();

const likeVideo = async ({ video, user = null }) => {
  if (!user) user = buildUser();

  const like = await prisma.videoLike.create({
    data: {
      like: 1,
      video: {
        connect: {
          id: video.id,
        },
      },
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  return like;
};

const dislikeVideo = async ({ video, user = null }) => {
  if (!user) user = buildUser();

  const dislike = await prisma.videoLike.create({
    data: {
      like: -1,
      video: {
        connect: {
          id: video.id,
        },
      },
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  return dislike;
};

module.exports = { likeVideo, dislikeVideo };
