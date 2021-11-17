const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const viewVideo = async (video) => {
  const view = await prisma.view.create({
    data: {
      video: {
        connect: {
          id: video.id,
        },
      },
    },
  });

  return view;
};

module.exports = { viewVideo };
