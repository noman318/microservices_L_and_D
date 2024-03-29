import { Request, Response, Express } from "express";
import { createConnection } from "typeorm";
import amqp from "amqplib/callback_api";
import dotenv from "dotenv";
// import ormConfig from "../ormconfig.json";
// console.log("ormConfig", ormConfig);
import express from "express";
import cors from "cors";
import { Product } from "./entity/product";
const PORT = Number(4000);
dotenv.config();

createConnection().then((database) => {
  const productRepository = database.getRepository(Product);
  //@ts-expect-error
  amqp.connect(process.env.AMQP_URL, (error: any, connection: any) => {
    if (error) {
      return;
    }
    connection.createChannel((error: any, channel: any) => {
      if (error) {
        throw Error(error);
      }
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

      app.get("/", async (req: Request, res: Response) => {
        res.json({ message: "Testing Root Route" });
        channel.sendToQueue("hello", Buffer.from("hello"));
      });

      app.get("/api/products", async (req: Request, res: Response) => {
        const products = await productRepository.find();
        return res.json(products);
      });

      app.post("/api/product", async (req: Request, res: Response) => {
        // const { title, image, likes } = req.body;
        const product = await productRepository.create(req.body);
        const createProduct = await productRepository.save(product);
        channel.sendToQueue(
          "product_created",
          Buffer.from(JSON.stringify(createProduct))
        );

        return res.json(createProduct);
      });

      app.get("/api/product/:id", async (req: Request, res: Response) => {
        const { id } = req.params;
        // console.log("reqParams", req.params.id);
        const product = await productRepository.findOne({
          where: { id: req.params.id },
        });
        channel.sendToQueue(
          "get_product_by_id",
          Buffer.from(JSON.stringify(id))
        );
        // console.log("product", product);
        return res.json(product);
      });

      app.put(
        "/api/product/update/:id",
        async (req: Request, res: Response) => {
          try {
            const product = await productRepository.findOne({
              where: { id: req.params.id },
            });
            console.log("product", product);
            if (product) {
              productRepository.merge(product, req.body);
              const result = await productRepository.save(product);
              // console.log("result", result);
              channel.sendToQueue(
                "product_updated",
                Buffer.from(JSON.stringify(result))
              );
              return res.status(200).json(result);
            }
            res.status(400).json({ message: "Product Not Found" });
          } catch (error) {}
        }
      );

      app.delete("/api/product/:id", async (req: Request, res: Response) => {
        // console.log("reqParams", req.params.id);
        const { id } = req.params;
        console.log("id", id);
        const product = await productRepository.delete({
          id: req.params.id,
        });

        // console.log("product", product);
        channel.sendToQueue("product_deleted", Buffer.from(id));
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
  });
});
