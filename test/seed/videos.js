const { PrismaClient } = require("@prisma/client");
const faker = require("faker");

const { buildUser } = require("./users");

const prisma = new PrismaClient();

const buildVideo = async (overrides = {}) => {
  let { user, ...otherProps } = overrides;

  if (!user) user = await buildUser();

  const video = await prisma.video.create({
    data: {
      title: faker.datatype.string(5),
      description: faker.lorem.sentences(2),
      url: faker.internet.url(),
      thumbnail: faker.image.avatar(),
      ...otherProps,
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  return video;
};

module.exports = { buildVideo };
