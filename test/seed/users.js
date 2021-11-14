const jwt = require("jsonwebtoken");
const faker = require("faker");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const user = {
  name: "user",
  picture: "http://picture.com/123",
  email: "user@gmail.com",
};

const buildUser = async () => {
  const data = {
    username: faker.internet.userName(),
    avatar: faker.image.avatar(),
    email: faker.internet.email(),
  };

  const user = await prisma.user.create({
    data,
  });

  return user;
};

const getJwtToken = (user) => {
  const payload = { id: user.id };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  return token;
};

module.exports = { user, buildUser, getJwtToken };
