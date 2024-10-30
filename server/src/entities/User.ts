import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Game } from "./Game";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ default: 1500 })
    rating: number;

    @OneToMany(() => Game, game => game.whitePlayer)
    gamesAsWhite: Game[];

    @OneToMany(() => Game, game => game.blackPlayer)
    gamesAsBlack: Game[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}