import { Request, Response, Express } from "express";
import { createConnection } from "typeorm";
import express from "express";
import cors from "cors";
import { Product } from "./entity/product";
const PORT = 4002;

createConnection().then((database) => {
  const productRepository = database.getMongoRepository(Product);

  const app: Express = express();

  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:4200",
      ],
      methods: "GET, POST, PUT, PATCH, DELETE",
    })
  );
  app.use(express.json());

  app.get("/api/products", async (req: Request, res: Response) => {
    const products = await productRepository.find();
    return res.json(products);
  });

  app.listen(PORT, () => console.log(`Main Server is running on PORT ${PORT}`));
});
