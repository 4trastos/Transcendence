import Message from "./Message";
export declare class Chat {
    id: string;
    active?: boolean;
    title: string;
    avatarUrl?: string;
    users: string[];
    isGroupChat: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    messages: Message[];
    constructor(id: string, active: boolean, title: string, users: string[], isGroupChat: boolean, createdAt: Date, updatedAt: Date, messages: Message[]);
}
