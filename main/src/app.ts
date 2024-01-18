import { Request, Response, Express } from "express";
import { createConnection } from "typeorm";
import express from "express";
import cors from "cors";
import { Product } from "./entity/product";
import dotenv from "dotenv";
import amqp from "amqplib/callback_api";
import axios from "axios";

const PORT = 4002;
dotenv.config();
createConnection().then((database) => {
  const productRepository = database.getMongoRepository(Product);
  // console.log("amqpUrls", process.env.AMQP_URL);
  //@ts-expect-error
  amqp.connect(process.env.AMQP_URL, (error, connection) => {
    if (error) {
      throw error;
    }

    connection.createChannel((error: any, channel: any) => {
      if (error) {
        throw error;
      }
      channel.assertQueue("hello", { durable: false });
      channel.assertQueue("product_created", { durable: false });
      channel.assertQueue("product_updated", { durable: false });
      channel.assertQueue("product_deleted", { durable: false });
      channel.assertQueue("get_product_by_id", { durable: false });
      const app = express();

      app.use(
        cors({
          origin: [
            "http://localhost:3000",
            "http://localhost:8080",
            "http://localhost:4200",
          ],
        })
      );

      app.use(express.json());

      // channel.consume("hello", (msg: any) => {
      //   console.log(msg?.content.toString());
      // });

      channel.consume(
        "get_product_by_id",
        async (msg: any) => {
          const eventProduct = JSON.parse(msg.content.toString());
          const product = await productRepository.findOne(eventProduct.id);
          console.log("get_product_by_id");
          return product;
        },
        { noAck: true }
      );

      channel.consume(
        "product_created",
        async (msg: any) => {
          const eventProduct: Product = JSON.parse(msg.content.toString());
          const product = new Product();
          product.userId = eventProduct.id;
          product.image = eventProduct.image;
          product.title = eventProduct.title;
          product.likes = eventProduct.likes;
          await productRepository.save(product);
          console.log("product_created");
        },
        { noAck: true }
      );

      channel.consume(
        "product_updated",
        async (msg: any) => {
          const eventProduct: Product = JSON.parse(msg.content.toString());
          const product = await productRepository.findOne({
            where: { userId: eventProduct.id },
          });
          console.log("product", product);
          if (!product) {
            throw Error("Product not Found");
          }
          productRepository.merge(product, {
            title: eventProduct.title,
            image: eventProduct.image,
            likes: eventProduct.likes,
          });
          await productRepository.save(product);
          console.log("product_updated");
        },
        { noAck: true }
      );

      channel.consume(
        "product_deleted",
        async (msg: any) => {
          console.log("msg", msg.content);
          const userId = msg.content.toString();
          console.log("userId", userId);
          try {
            const deletedProject = await productRepository.delete({ userId });
            console.log("deletedProject", deletedProject);
            console.log("product_deleted");

            channel.ack(msg);
          } catch (error) {
            console.error("Error deleting project:", error);
          }
        },
        { noAck: true }
      );

      app.get("/api/products", async (req, res) => {
        const products = await productRepository.find();
        return res.json(products);
      });

      app.post("/api/product/:id/like", async (req: Request, res: Response) => {
        console.log("req.params.id", req.params.id);
        const product = await productRepository.findOne({
          where: { userId: req.params.id },
        });
        console.log("product", product);

        if (product) {
          await axios.post(
            `http://localhost:4000/api/product/${product?.userId}/like`,
            {}
          );

          // Check if product.likes is defined before incrementing
          if (product.likes !== undefined) {
            product.likes++;
            await productRepository.save(product);
            return res.send(product);
          } else {
            // Handle the case where product.likes is undefined
            return res.status(500).send("Error: likes property is undefined");
          }
        } else {
          // Handle the case where product is undefined
          return res.status(404).send("Product not found");
        }
      });

      app.listen(PORT, () => console.log(`Admin Server running port ${PORT}`));

      process.on("beforeExit", () => {
        console.log(`closing`);
        connection.close();
      });
    });
  });
});
