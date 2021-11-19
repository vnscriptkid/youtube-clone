const { PrismaClient } = require("@prisma/client");
const faker = require("faker");

const { buildUser } = require("./users");
const { buildVideo } = require("./videos");

const prisma = new PrismaClient();

const buildComment = async (overrides = {}) => {
  let { user, video, ...otherProps } = overrides;

  if (!user) user = await buildUser();
  if (!video) video = await buildVideo();

  const comment = await prisma.comment.create({
    data: {
      text: faker.lorem.sentence(),
      user: {
        connect: {
          id: user.id,
        },
      },
      video: {
        connect: {
          id: video.id,
        },
      },
      ...otherProps,
    },
  });

  return comment;
};

module.exports = { buildComment };
