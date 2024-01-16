import { Entity, ObjectIdColumn, Column } from "typeorm";

@Entity()
export class Product {
  @ObjectIdColumn()
  id!: String;

  @Column({ unique: true })
  userId!: String;

  @Column()
  title!: String;

  @Column()
  image!: String;

  @Column({ default: 0 })
  likes!: number;
}
