import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Game } from "../entities/Game";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL || "postgresql://engine:password@localhost:5432/project_db",
    synchronize: true,
    logging: true,
    entities: [User, Game],
    subscribers: [],
    migrations: [],
});