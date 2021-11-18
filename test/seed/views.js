const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const viewVideo = async (video, numOfViews = 1) => {
  const views = [];

  for (let _ of Array(numOfViews)) {
    const view = await prisma.view.create({
      data: {
        video: {
          connect: {
            id: video.id,
          },
        },
      },
    });

    views.push(view);
  }

  return views.length === 1 ? views[0] : views;
};

module.exports = { viewVideo };
