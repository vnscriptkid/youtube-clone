const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const user = {
  name: "user",
  picture: "http://picture.com/123",
  email: "user@gmail.com",
};

const buildUser = async () => {
  const data = {
    username: "user",
    avatar: "http://picture.com/123",
    email: "user@gmail.com",
  };

  const user = await prisma.user.create({
    data,
  });

  const payload = { id: user.id };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  return { user, token };
};

module.exports = { user, buildUser };
