import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { User } from "./User";

export enum GameStatus {
    PENDING = "pending",
    ACTIVE = "active",
    COMPLETED = "completed",
    ABORTED = "aborted"
}

export enum GameResult {
    WHITE_WINS = "white_wins",
    BLACK_WINS = "black_wins",
    DRAW = "draw",
    ONGOING = "ongoing"
}

@Entity()
export class Game {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => User, user => user.gamesAsWhite)
    whitePlayer: User;

    @ManyToOne(() => User, user => user.gamesAsBlack)
    blackPlayer: User;

    @Column({ type: "text", default: "" })
    pgn: string;

    @Column({ type: "text", default: "" })
    fen: string;

    @Column({
        type: "enum",
        enum: GameStatus,
        default: GameStatus.PENDING
    })
    status: GameStatus;

    @Column({
        type: "enum",
        enum: GameResult,
        default: GameResult.ONGOING
    })
    result: GameResult;

    @Column({ type: "int", default: 600 }) // 10 minutes in seconds
    timeControl: number;

    @Column({ type: "int", nullable: true })
    whiteTimeRemaining: number;

    @Column({ type: "int", nullable: true })
    blackTimeRemaining: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}