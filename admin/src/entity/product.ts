import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert } from "typeorm";
import uuid4 from "uuid4";

@Entity()
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: number | String;

  @Column()
  title!: String;

  @Column()
  image!: String;

  @Column({ default: 0 })
  likes!: number;

  @BeforeInsert()
  generateId() {
    if (this.id) {
      this.id = uuid4();
    }
  }
}
