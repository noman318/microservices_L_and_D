import { Request, Response, Express } from "express";
import { createConnection } from "typeorm";
import express from "express";
import cors from "cors";
import { Product } from "./entity/product";
import dotenv from "dotenv";
import amqp from "amqplib/callback_api";

const PORT = 4002;
dotenv.config();
createConnection().then((database) => {
  const productRepository = database.getMongoRepository(Product);
  // console.log("amqpUrls", process.env.AMQP_URL);
  //@ts-expect-error

  amqp.connect(process.env.AMQP_URL, (error: any, connection: any) => {
    if (error) {
      throw error;
    }
    connection.createChannel((error: any, channel: any) => {
      if (error) {
        throw error;
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

      app.get("/api/products", async (req: Request, res: Response) => {
        const products = await productRepository.find();
        return res.json(products);
      });

      app.listen(PORT, () =>
        console.log(`Main Server is running on PORT ${PORT}`)
      );
    });
  });
});
