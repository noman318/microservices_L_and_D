import { Request, Response, Express } from "express";
import { createConnection } from "typeorm";
// import ormConfig from "../ormconfig.json";
// console.log("ormConfig", ormConfig);
import express from "express";
import cors from "cors";
import { Product } from "./entity/product";
const PORT = Number(4000);

createConnection().then((database) => {
  const productRepository = database.getRepository(Product);
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

  app.post("/api/product", async (req: Request, res: Response) => {
    // const { title, image, likes } = req.body;
    const product = await productRepository.create(req.body);
    const createProduct = await productRepository.save(product);
    return res.json(createProduct);
  });

  app.get("/api/product/:id", async (req: Request, res: Response) => {
    // console.log("reqParams", req.params.id);
    const product = await productRepository.findOne({
      where: { id: req.params.id },
    });

    console.log("product", product);
    return res.json(product);
  });

  app.put("/api/product/update/:id", async (req: Request, res: Response) => {
    try {
      const product = await productRepository.findOne({
        where: { id: req.params.id },
      });
      console.log("product", product);
      if (product) {
        productRepository.merge(product, req.body);
        const result = await productRepository.save(product);
        console.log("result", result);
        return res.status(200).json(result);
      }
      res.status(400).json({ message: "Product Not Found" });
    } catch (error) {}
  });

  app.delete("/api/product/:id", async (req: Request, res: Response) => {
    // console.log("reqParams", req.params.id);
    const { id } = req.params;
    console.log("id", id);
    const product = await productRepository.delete({
      id: req.params.id,
    });

    console.log("product", product);
    return res.json(product);
  });

  app.post("/api/product/:id/like", async (req: Request, res: Response) => {
    try {
      const product = await productRepository.findOne({
        where: { id: req.params.id },
      });
      // console.log("product", product);
      if (product) {
        product.likes++;

        const result = await productRepository.save(product);
        console.log("result", result);
        return res.status(200).json(result);
      }
      res.status(400).json({ message: "Product Not Found" });
    } catch (error) {}
  });

  app.listen(PORT, () => console.log(`Admin Server running port ${PORT}`));
});
