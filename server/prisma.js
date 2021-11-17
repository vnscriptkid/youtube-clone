import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});

prisma.$on("query", async (e) => {
  console.log("\x1b[32m%s\x1b[0m", `[Query] ${e.query}`);
  console.log("\x1b[33m%s\x1b[0m", `[Params] ${e.params}`);
  console.log("\x1b[44m%s\x1b[0m", `[Duration] ${e.duration}`);
});

export default prisma;
